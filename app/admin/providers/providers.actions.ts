"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  UpdateProviderSchema,
  SoftDeleteProviderSchema,
  type UpdateProviderInput,
  type SoftDeleteProviderInput,
} from "@/server/validations/provider";

export async function updateProvider(
  input: UpdateProviderInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = UpdateProviderSchema.parse(input);

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.provider)
        .where(and(eq(schema.provider.id, validated.id), isNull(schema.provider.deletedAt)));

      if (!before) {
        throw new Error("Prestataire introuvable ou supprimé");
      }

      const [after] = await tx
        .update(schema.provider)
        .set({
          nom: validated.nom,
          email: validated.email,
          telephone: validated.telephone ?? null,
          ville: validated.ville ?? null,
          metierId: validated.metierId ?? null,
          bio: validated.bio ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.provider.id, validated.id))
        .returning();

      await logAudit(
        ctx,
        "update",
        "provider",
        validated.id,
        { nom: before.nom, email: before.email },
        { nom: after.nom, email: after.email }
      );
    });

    revalidatePath("/admin/providers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteProvider(
  input: SoftDeleteProviderInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = SoftDeleteProviderSchema.parse(input);

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.provider)
        .where(and(eq(schema.provider.id, validated.id), isNull(schema.provider.deletedAt)));

      if (!before) {
        throw new Error("Prestataire introuvable ou déjà supprimé");
      }

      const now = new Date();
      await tx
        .update(schema.provider)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.provider.id, validated.id));

      await logAudit(ctx, "soft_delete", "provider", validated.id, {
        nom: before.nom,
        email: before.email,
      }, null);
    });

    revalidatePath("/admin/providers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
