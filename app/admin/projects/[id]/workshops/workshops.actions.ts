"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import { isWorkshopInUse } from "@/server/queries/workshop";
import {
  CreateWorkshopSchema,
  UpdateWorkshopSchema,
  SoftDeleteWorkshopSchema,
  type CreateWorkshopInput,
  type UpdateWorkshopInput,
  type SoftDeleteWorkshopInput,
} from "@/server/validations/workshop-instance";

export async function createWorkshop(
  input: CreateWorkshopInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = CreateWorkshopSchema.parse(input);

    // TODO(multi-centre): passer centreId depuis le projet parent quand les ateliers privés seront supportés (BDR-022)
    const [created] = await db
      .insert(schema.workshop)
      .values({
        projectId: validated.projectId,
        typeId: validated.typeId ?? null,
        nom: validated.nom,
        description: validated.description ?? null,
        seancesCount: validated.seancesCount,
        durationMin: validated.durationMin,
      })
      .returning();

    await logAudit(ctx, "create", "workshop", created.id, null, {
      projectId: validated.projectId,
      nom: created.nom,
    });

    revalidatePath(`/admin/projects/${validated.projectId}/workshops`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function updateWorkshop(
  input: UpdateWorkshopInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = UpdateWorkshopSchema.parse(input);

    let projectId: string | null = null;

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.workshop)
        .where(and(eq(schema.workshop.id, validated.id), isNull(schema.workshop.deletedAt)));

      if (!before) throw new Error("Atelier introuvable ou supprimé");
      projectId = before.projectId ?? null;

      const [after] = await tx
        .update(schema.workshop)
        .set({
          typeId: validated.typeId ?? null,
          nom: validated.nom,
          description: validated.description ?? null,
          seancesCount: validated.seancesCount,
          durationMin: validated.durationMin,
          updatedAt: new Date(),
        })
        .where(eq(schema.workshop.id, validated.id))
        .returning();

      await logAudit(
        ctx,
        "update",
        "workshop",
        validated.id,
        { nom: before.nom, seancesCount: before.seancesCount },
        { nom: after.nom, seancesCount: after.seancesCount }
      );
    });

    revalidatePath(`/admin/projects`);
    if (projectId) revalidatePath(`/admin/projects/${projectId}/workshops`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteWorkshop(
  input: SoftDeleteWorkshopInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = SoftDeleteWorkshopSchema.parse(input);

    const inUse = await isWorkshopInUse(validated.id);
    if (inUse) {
      return {
        ok: false,
        error: "Cet atelier est utilisé par une ou plusieurs séances et ne peut pas être supprimé.",
      };
    }

    let projectId: string | null = null;

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.workshop)
        .where(and(eq(schema.workshop.id, validated.id), isNull(schema.workshop.deletedAt)));

      if (!before) throw new Error("Atelier introuvable ou déjà supprimé");
      projectId = before.projectId ?? null;

      const now = new Date();
      await tx
        .update(schema.workshop)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.workshop.id, validated.id));

      await logAudit(ctx, "soft_delete", "workshop", validated.id, { nom: before.nom }, null);
    });

    revalidatePath(`/admin/projects`);
    if (projectId) revalidatePath(`/admin/projects/${projectId}/workshops`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
