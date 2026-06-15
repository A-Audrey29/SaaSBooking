"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import type { ServerContext } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  CreateUserSchema,
  UpdateUserSchema,
  SoftDeleteUserSchema,
  ResendInvitationSchema,
  SetupPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type SoftDeleteUserInput,
  type ResendInvitationInput,
  type SetupPasswordInput,
} from "@/server/validations/user";
import bcrypt from "bcryptjs";
import { sendInvitationEmail } from "@/server/emails/send-invitation";

// ---------------------------------------------------------------------------
// Admin actions — super_admin only
// ---------------------------------------------------------------------------

export async function createUser(
  input: CreateUserInput
): Promise<{ ok: true; emailSent: boolean } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = CreateUserSchema.parse(input);

    const [actor] = await db
      .select({ name: schema.user.name })
      .from(schema.user)
      .where(eq(schema.user.id, ctx.userId));
    const actorName = actor?.name ?? ctx.userId;

    const { email, name, token } = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.user)
        .values({
          email: validated.email,
          name: validated.name,
          role: validated.role,
          centreId: validated.centreId,
          passwordSet: false,
          emailVerified: false,
        })
        .returning();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const invitationToken = crypto.randomUUID();

      await tx.insert(schema.userInvitation).values({
        userId: created.id,
        token: invitationToken,
        expiresAt,
      });

      await logAudit(ctx, "create", "user", created.id, null, {
        email: created.email,
        role: created.role,
        centreId: created.centreId,
      });

      return { email: created.email, name: created.name, token: invitationToken };
    });

    let emailSent = false;
    try {
      const result = await sendInvitationEmail({
        to: email,
        name,
        inviterName: actorName,
        token,
      });
      emailSent = result.sent;
      if (!result.sent && result.error) {
        console.error("Failed to send invitation email:", result.error);
      }
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }

    revalidatePath("/admin/users");
    return { ok: true, emailSent };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "23505" &&
      "constraint" in error &&
      error.constraint === "user_email_unique_active"
    ) {
      return { ok: false, error: "Un utilisateur avec cet email existe déjà" };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function updateUser(
  input: UpdateUserInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = UpdateUserSchema.parse(input);

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.user)
        .where(and(eq(schema.user.id, validated.id), isNull(schema.user.deletedAt)));

      if (!before) {
        throw new Error("Utilisateur introuvable ou supprimé");
      }

      const [after] = await tx
        .update(schema.user)
        .set({
          role: validated.role,
          centreId: validated.centreId,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, validated.id))
        .returning();

      await logAudit(
        ctx,
        "update",
        "user",
        validated.id,
        { role: before.role, centreId: before.centreId },
        { role: after.role, centreId: after.centreId }
      );
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteUser(
  input: SoftDeleteUserInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = SoftDeleteUserSchema.parse(input);

    if (validated.id === ctx.userId) {
      return { ok: false, error: "Impossible de se supprimer soi-même" };
    }

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.user)
        .where(and(eq(schema.user.id, validated.id), isNull(schema.user.deletedAt)));

      if (!before) {
        throw new Error("Utilisateur introuvable ou déjà supprimé");
      }

      const now = new Date();
      // Anonymise l'email pour libérer l'adresse réelle immédiatement et
      // éviter que Better Auth (findUserByEmail, sans filtre deleted_at)
      // ne retrouve une ligne soft-deleted au login.
      const anonymizedEmail = `deleted-${validated.id}@deleted.local`;
      await tx
        .update(schema.user)
        .set({ email: anonymizedEmail, deletedAt: now, updatedAt: now })
        .where(eq(schema.user.id, validated.id));

      await logAudit(
        ctx,
        "soft_delete",
        "user",
        validated.id,
        { email: before.email, role: before.role, centreId: before.centreId },
        null
      );
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function resendInvitation(
  input: ResendInvitationInput
): Promise<{ ok: true; emailSent: boolean } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = ResendInvitationSchema.parse(input);

    const [actor] = await db
      .select({ name: schema.user.name })
      .from(schema.user)
      .where(eq(schema.user.id, ctx.userId));
    const actorName = actor?.name ?? ctx.userId;

    const { email, name, token } = await db.transaction(async (tx) => {
      const [found] = await tx
        .select()
        .from(schema.user)
        .where(and(eq(schema.user.id, validated.id), isNull(schema.user.deletedAt)));

      if (!found) {
        throw new Error("Utilisateur introuvable ou supprimé");
      }

      if (found.passwordSet) {
        throw new Error("L'utilisateur a déjà défini son mot de passe");
      }

      await tx
        .delete(schema.userInvitation)
        .where(eq(schema.userInvitation.userId, validated.id));

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const invitationToken = crypto.randomUUID();

      await tx.insert(schema.userInvitation).values({
        userId: validated.id,
        token: invitationToken,
        expiresAt,
      });

      await logAudit(ctx, "update", "user", validated.id, { passwordSet: false }, { invitationResent: true });

      return { email: found.email, name: found.name, token: invitationToken };
    });

    let emailSent = false;
    try {
      const result = await sendInvitationEmail({
        to: email,
        name,
        inviterName: actorName,
        token,
      });
      emailSent = result.sent;
    } catch (emailError) {
      console.error("Failed to resend invitation email:", emailError);
    }

    revalidatePath("/admin/users");
    return { ok: true, emailSent };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

// ---------------------------------------------------------------------------
// Public action — no requireRole
// ---------------------------------------------------------------------------

export async function setupPassword(
  input: SetupPasswordInput
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  try {
    const validated = SetupPasswordSchema.parse(input);
    const now = new Date();
    const hash = await bcrypt.hash(validated.password, 10);

    const userId = await db.transaction(async (tx) => {
      const [invitation] = await tx
        .select()
        .from(schema.userInvitation)
        .where(eq(schema.userInvitation.token, validated.token));

      if (!invitation) {
        throw new Error("Invitation invalide ou introuvable");
      }
      if (invitation.expiresAt < now) {
        throw new Error("Invitation expirée");
      }
      if (invitation.usedAt !== null) {
        throw new Error("Invitation déjà utilisée");
      }

      const [targetUser] = await tx
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, invitation.userId));

      if (!targetUser) {
        throw new Error("Utilisateur introuvable");
      }

      await tx.insert(schema.account).values({
        id: crypto.randomUUID(),
        accountId: targetUser.id,
        providerId: "credential",
        password: hash,
        userId: targetUser.id,
        createdAt: now,
        updatedAt: now,
      });

      await tx
        .update(schema.user)
        .set({ passwordSet: true, updatedAt: now })
        .where(eq(schema.user.id, targetUser.id));

      await tx
        .update(schema.userInvitation)
        .set({ usedAt: now })
        .where(eq(schema.userInvitation.id, invitation.id));

      const minimalCtx: ServerContext = {
        userId: targetUser.id,
        centreId: targetUser.centreId ?? null,
        role: targetUser.role as ServerContext["role"],
      };
      await logAudit(minimalCtx, "update", "user", targetUser.id, { passwordSet: false }, { passwordSet: true });

      return targetUser.id;
    });

    return { ok: true, userId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
