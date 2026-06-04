"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  AssignProviderSchema,
  RemoveAssignmentSchema,
  type AssignProviderInput,
  type RemoveAssignmentInput,
} from "@/server/validations/provider-assignment";

export async function assignProvider(
  input: AssignProviderInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = AssignProviderSchema.parse(input);

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.providerAssignment)
        .values({
          projectId: validated.projectId,
          providerId: validated.providerId,
          metierId: validated.metierId,
        })
        .returning();

      await logAudit(ctx, "create", "provider_assignment", created.id, null, {
        projectId: created.projectId,
        providerId: created.providerId,
        metierId: created.metierId,
      });
    });

    revalidatePath(`/admin/projects/${validated.projectId}/providers`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function removeAssignment(
  input: RemoveAssignmentInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = RemoveAssignmentSchema.parse(input);

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.providerAssignment)
        .where(
          and(
            eq(schema.providerAssignment.id, validated.id),
            isNull(schema.providerAssignment.deletedAt)
          )
        );

      if (!before) {
        throw new Error("Affectation introuvable ou déjà supprimée");
      }

      await tx
        .update(schema.providerAssignment)
        .set({ deletedAt: new Date() })
        .where(eq(schema.providerAssignment.id, validated.id));

      await logAudit(ctx, "soft_delete", "provider_assignment", validated.id, {
        projectId: before.projectId,
        providerId: before.providerId,
        metierId: before.metierId,
      }, null);
    });

    revalidatePath(`/admin/projects/${validated.projectId}/providers`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
