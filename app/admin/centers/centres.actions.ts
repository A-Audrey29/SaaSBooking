"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  CreateCentreSchema,
  UpdateCentreSchema,
  type CreateCentreInput,
  type UpdateCentreInput,
} from "@/server/validations/centre";

/**
 * Get all non-deleted centres.
 * Access: super_admin only.
 */
export async function getCentres() {
  await requireRole("super_admin");

  const centres = await db
    .select()
    .from(schema.centre)
    .where(isNull(schema.centre.deletedAt));

  return centres;
}

/**
 * Create a new centre.
 * Access: super_admin only.
 */
export async function createCentre(data: CreateCentreInput) {
  const ctx = await requireRole("super_admin");
  const validated = CreateCentreSchema.parse(data);

  const result = await db.transaction(async (tx) => {
    const [newCentre] = await tx
      .insert(schema.centre)
      .values({
        nom: validated.nom,
        ville: validated.ville,
        adresse: validated.adresse,
        timezone: validated.timezone,
        telephone: validated.telephone,
        email: validated.email,
      })
      .returning();

    await logAudit(ctx, "create", "centre", newCentre.id, null, {
      id: newCentre.id,
      nom: newCentre.nom,
      ville: newCentre.ville,
      adresse: newCentre.adresse,
      timezone: newCentre.timezone,
      telephone: newCentre.telephone,
      email: newCentre.email,
      createdAt: newCentre.createdAt,
      updatedAt: newCentre.updatedAt,
      deletedAt: newCentre.deletedAt,
    });

    return newCentre;
  });

  revalidatePath("/admin/centers");
  return result;
}

/**
 * Update an existing centre.
 * Access: super_admin only.
 */
export async function updateCentre(data: UpdateCentreInput) {
  const ctx = await requireRole("super_admin");
  const validated = UpdateCentreSchema.parse(data);

  const result = await db.transaction(async (tx) => {
    // Read before state
    const [before] = await tx
      .select()
      .from(schema.centre)
      .where(
        and(
          eq(schema.centre.id, validated.id),
          isNull(schema.centre.deletedAt)
        )
      );

    if (!before) {
      throw new Error("Centre not found or already deleted");
    }

    // Update
    const [updated] = await tx
      .update(schema.centre)
      .set({
        nom: validated.nom,
        ville: validated.ville,
        adresse: validated.adresse,
        timezone: validated.timezone,
        telephone: validated.telephone,
        email: validated.email,
        updatedAt: new Date(),
      })
      .where(eq(schema.centre.id, validated.id))
      .returning();

    // Log audit
    await logAudit(
      ctx,
      "update",
      "centre",
      validated.id,
      {
        id: before.id,
        nom: before.nom,
        ville: before.ville,
        adresse: before.adresse,
        timezone: before.timezone,
        telephone: before.telephone,
        email: before.email,
        createdAt: before.createdAt,
        updatedAt: before.updatedAt,
        deletedAt: before.deletedAt,
      },
      {
        id: updated.id,
        nom: updated.nom,
        ville: updated.ville,
        adresse: updated.adresse,
        timezone: updated.timezone,
        telephone: updated.telephone,
        email: updated.email,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        deletedAt: updated.deletedAt,
      }
    );

    return updated;
  });

  revalidatePath("/admin/centers");
  return result;
}

/**
 * Soft delete a centre.
 * Access: super_admin only.
 */
export async function softDeleteCentre(id: string) {
  const ctx = await requireRole("super_admin");
  z.string().uuid().parse(id);

  await db.transaction(async (tx) => {
    // Read before state
    const [before] = await tx
      .select()
      .from(schema.centre)
      .where(
        and(eq(schema.centre.id, id), isNull(schema.centre.deletedAt))
      );

    if (!before) {
      throw new Error("Centre not found or already deleted");
    }

    // Soft delete
    const now = new Date();
    const [deleted] = await tx
      .update(schema.centre)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.centre.id, id))
      .returning();

    // Log audit
    await logAudit(
      ctx,
      "soft_delete",
      "centre",
      id,
      {
        id: before.id,
        nom: before.nom,
        ville: before.ville,
        adresse: before.adresse,
        timezone: before.timezone,
        telephone: before.telephone,
        email: before.email,
        createdAt: before.createdAt,
        updatedAt: before.updatedAt,
        deletedAt: before.deletedAt,
      },
      {
        id: deleted.id,
        nom: deleted.nom,
        ville: deleted.ville,
        adresse: deleted.adresse,
        timezone: deleted.timezone,
        telephone: deleted.telephone,
        email: deleted.email,
        createdAt: deleted.createdAt,
        updatedAt: deleted.updatedAt,
        deletedAt: deleted.deletedAt,
      }
    );
  });

  revalidatePath("/admin/centers");
}
