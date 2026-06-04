"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  CreateWorkshopTypeSchema,
  UpdateWorkshopTypeSchema,
  CreateRoleGroupSchema,
  UpdateRoleGroupSchema,
  CreateRoleSlotSchema,
  UpdateRoleSlotSchema,
  SoftDeleteSchema,
  type CreateWorkshopTypeInput,
  type UpdateWorkshopTypeInput,
  type CreateRoleGroupInput,
  type UpdateRoleGroupInput,
  type CreateRoleSlotInput,
  type UpdateRoleSlotInput,
  type SoftDeleteInput,
} from "@/server/validations/workshop";

// ─── WorkshopType ────────────────────────────────────────────────────────────

export async function createWorkshopType(
  data: CreateWorkshopTypeInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = CreateWorkshopTypeSchema.parse(data);

    const [created] = await db
      .insert(schema.workshopType)
      .values({
        centreId: validated.centreId,
        code: validated.code,
        nom: validated.nom,
        description: validated.description,
      })
      .returning();

    revalidatePath("/admin/workshops");
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[createWorkshopType]", error);
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function updateWorkshopType(
  data: UpdateWorkshopTypeInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = UpdateWorkshopTypeSchema.parse(data);

    const [before] = await db
      .select()
      .from(schema.workshopType)
      .where(
        and(
          eq(schema.workshopType.id, validated.id),
          isNull(schema.workshopType.deletedAt)
        )
      );

    if (!before) throw new Error("WorkshopType introuvable ou supprimé");

    await db
      .update(schema.workshopType)
      .set({
        code: validated.code,
        nom: validated.nom,
        description: validated.description,
        updatedAt: new Date(),
      })
      .where(eq(schema.workshopType.id, validated.id));

    revalidatePath("/admin/workshops");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteWorkshopType(
  data: SoftDeleteInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const { id } = SoftDeleteSchema.parse(data);

    const [before] = await db
      .select()
      .from(schema.workshopType)
      .where(and(eq(schema.workshopType.id, id), isNull(schema.workshopType.deletedAt)));

    if (!before) throw new Error("WorkshopType introuvable ou supprimé");

    const activeGroups = await db
      .select()
      .from(schema.workshopRoleGroup)
      .where(
        and(
          eq(schema.workshopRoleGroup.workshopTypeId, id),
          isNull(schema.workshopRoleGroup.deletedAt)
        )
      );

    if (activeGroups.length > 0) {
      throw new Error(
        `Impossible de supprimer : ${activeGroups.length} groupe(s) actif(s) existent`
      );
    }

    const now = new Date();
    const [deleted] = await db
      .update(schema.workshopType)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.workshopType.id, id))
      .returning();

    await logAudit(ctx, "soft_delete", "workshop_type", id, before, deleted);

    revalidatePath("/admin/workshops");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

// ─── RoleGroup ───────────────────────────────────────────────────────────────

export async function createRoleGroup(
  data: CreateRoleGroupInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = CreateRoleGroupSchema.parse(data);

    const [created] = await db
      .insert(schema.workshopRoleGroup)
      .values({
        workshopTypeId: validated.workshopTypeId,
        label: validated.label,
        ordre: validated.ordre,
      })
      .returning();

    revalidatePath("/admin/workshops");
    return { ok: true, id: created.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function updateRoleGroup(
  data: UpdateRoleGroupInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = UpdateRoleGroupSchema.parse(data);

    const [before] = await db
      .select()
      .from(schema.workshopRoleGroup)
      .where(
        and(
          eq(schema.workshopRoleGroup.id, validated.id),
          isNull(schema.workshopRoleGroup.deletedAt)
        )
      );

    if (!before) throw new Error("RoleGroup introuvable ou supprimé");

    await db
      .update(schema.workshopRoleGroup)
      .set({
        label: validated.label,
        ordre: validated.ordre,
        updatedAt: new Date(),
      })
      .where(eq(schema.workshopRoleGroup.id, validated.id));

    revalidatePath("/admin/workshops");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteRoleGroup(
  data: SoftDeleteInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const { id } = SoftDeleteSchema.parse(data);

    const [before] = await db
      .select()
      .from(schema.workshopRoleGroup)
      .where(
        and(
          eq(schema.workshopRoleGroup.id, id),
          isNull(schema.workshopRoleGroup.deletedAt)
        )
      );

    if (!before) throw new Error("RoleGroup introuvable ou supprimé");

    const activeSlots = await db
      .select()
      .from(schema.workshopRoleSlot)
      .where(
        and(
          eq(schema.workshopRoleSlot.workshopRoleGroupId, id),
          isNull(schema.workshopRoleSlot.deletedAt)
        )
      );

    if (activeSlots.length > 0) {
      throw new Error(
        `Impossible de supprimer : ${activeSlots.length} slot(s) actif(s) existent`
      );
    }

    const now = new Date();
    const [deleted] = await db
      .update(schema.workshopRoleGroup)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.workshopRoleGroup.id, id))
      .returning();

    await logAudit(ctx, "soft_delete", "workshop_role_group", id, before, deleted);

    revalidatePath("/admin/workshops");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

// ─── RoleSlot ────────────────────────────────────────────────────────────────

export async function createRoleSlot(
  data: CreateRoleSlotInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = CreateRoleSlotSchema.parse(data);

    const [created] = await db
      .insert(schema.workshopRoleSlot)
      .values({
        workshopRoleGroupId: validated.workshopRoleGroupId,
        role: validated.role,
        couleur: validated.couleur ?? null,
        isOptional: validated.isOptional,
        ordre: validated.ordre,
      })
      .returning();

    revalidatePath("/admin/workshops");
    return { ok: true, id: created.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function updateRoleSlot(
  data: UpdateRoleSlotInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = UpdateRoleSlotSchema.parse(data);

    const [before] = await db
      .select()
      .from(schema.workshopRoleSlot)
      .where(
        and(
          eq(schema.workshopRoleSlot.id, validated.id),
          isNull(schema.workshopRoleSlot.deletedAt)
        )
      );

    if (!before) throw new Error("RoleSlot introuvable ou supprimé");

    await db
      .update(schema.workshopRoleSlot)
      .set({
        role: validated.role,
        couleur: validated.couleur ?? null,
        isOptional: validated.isOptional,
        ordre: validated.ordre,
        updatedAt: new Date(),
      })
      .where(eq(schema.workshopRoleSlot.id, validated.id));

    revalidatePath("/admin/workshops");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteRoleSlot(
  data: SoftDeleteInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const { id } = SoftDeleteSchema.parse(data);

    const [before] = await db
      .select()
      .from(schema.workshopRoleSlot)
      .where(
        and(
          eq(schema.workshopRoleSlot.id, id),
          isNull(schema.workshopRoleSlot.deletedAt)
        )
      );

    if (!before) throw new Error("RoleSlot introuvable ou supprimé");

    const now = new Date();
    const [deleted] = await db
      .update(schema.workshopRoleSlot)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.workshopRoleSlot.id, id))
      .returning();

    await logAudit(ctx, "soft_delete", "workshop_role_slot", id, before, deleted);

    revalidatePath("/admin/workshops");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
