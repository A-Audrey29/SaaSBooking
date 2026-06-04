"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import { isMetierInUse } from "@/server/queries/metier";
import {
  CreateMetierSchema,
  UpdateMetierSchema,
  SoftDeleteMetierSchema,
  type CreateMetierInput,
  type UpdateMetierInput,
  type SoftDeleteMetierInput,
} from "@/server/validations/metier";

export async function createMetier(
  input: CreateMetierInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = CreateMetierSchema.parse(input);

    await db.insert(schema.metier).values({ nom: validated.nom });

    revalidatePath("/admin/metiers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function updateMetier(
  input: UpdateMetierInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("super_admin");
    const validated = UpdateMetierSchema.parse(input);

    const [before] = await db
      .select()
      .from(schema.metier)
      .where(and(eq(schema.metier.id, validated.id), isNull(schema.metier.deletedAt)));

    if (!before) throw new Error("Métier introuvable ou supprimé");

    await db
      .update(schema.metier)
      .set({ nom: validated.nom, updatedAt: new Date() })
      .where(eq(schema.metier.id, validated.id));

    revalidatePath("/admin/metiers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function softDeleteMetier(
  input: SoftDeleteMetierInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("super_admin");
    const validated = SoftDeleteMetierSchema.parse(input);

    const [before] = await db
      .select()
      .from(schema.metier)
      .where(and(eq(schema.metier.id, validated.id), isNull(schema.metier.deletedAt)));

    if (!before) throw new Error("Métier introuvable ou supprimé");

    const inUse = await isMetierInUse(validated.id);
    if (inUse) {
      return { ok: false, error: "Métier utilisé, impossible de supprimer" };
    }

    const now = new Date();
    const [deleted] = await db
      .update(schema.metier)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.metier.id, validated.id))
      .returning();

    await logAudit(ctx, "soft_delete", "metier", validated.id, { nom: before.nom }, null);

    revalidatePath("/admin/metiers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
