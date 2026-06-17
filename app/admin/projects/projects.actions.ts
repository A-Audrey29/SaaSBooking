"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  SoftDeleteProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type SoftDeleteProjectInput,
} from "@/server/validations/project";

export async function createProject(
  input: CreateProjectInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = CreateProjectSchema.parse(input);

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.project)
        .values({
          centreId: validated.centreId,
          nom: validated.nom,
          description: validated.description ?? null,
          financeur: validated.financeur ?? null,
          startDate: validated.startDate ?? null,
          endDate: validated.endDate ?? null,
        })
        .returning();

      await logAudit(ctx, "create", "project", created.id, null, {
        centreId: validated.centreId,
        nom: created.nom,
      });
    });

    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = UpdateProjectSchema.parse(input);

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.project)
        .where(and(eq(schema.project.id, validated.id), isNull(schema.project.deletedAt)));

      if (!before) {
        throw new Error("Projet introuvable ou supprimé");
      }

      const [after] = await tx
        .update(schema.project)
        .set({
          nom: validated.nom,
          description: validated.description ?? null,
          financeur: validated.financeur ?? null,
          startDate: validated.startDate ?? null,
          endDate: validated.endDate ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.project.id, validated.id))
        .returning();

      await logAudit(
        ctx,
        "update",
        "project",
        validated.id,
        { nom: before.nom, financeur: before.financeur },
        { nom: after.nom, financeur: after.financeur }
      );
    });

    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteProject(
  input: SoftDeleteProjectInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = SoftDeleteProjectSchema.parse(input);

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(schema.project)
        .where(and(eq(schema.project.id, validated.id), isNull(schema.project.deletedAt)));

      if (!before) {
        throw new Error("Projet introuvable ou déjà supprimé");
      }

      const now = new Date();
      await tx
        .update(schema.project)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.project.id, validated.id));

      await logAudit(ctx, "soft_delete", "project", validated.id, {
        nom: before.nom,
      }, null);
    });

    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
