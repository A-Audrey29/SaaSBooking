import { eq, isNull, and, or } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listAllMetiers() {
  return db
    .select({
      id: schema.metier.id,
      nom: schema.metier.nom,
      createdAt: schema.metier.createdAt,
    })
    .from(schema.metier)
    .where(isNull(schema.metier.deletedAt))
    .orderBy(schema.metier.nom);
}

export async function isMetierInUse(metierId: string): Promise<boolean> {
  const [slot] = await db
    .select({ id: schema.workshopRoleSlot.id })
    .from(schema.workshopRoleSlot)
    .where(
      and(
        eq(schema.workshopRoleSlot.metierId, metierId),
        isNull(schema.workshopRoleSlot.deletedAt)
      )
    )
    .limit(1);

  if (slot) return true;

  const [prov] = await db
    .select({ id: schema.provider.id })
    .from(schema.provider)
    .where(
      and(
        eq(schema.provider.metierId, metierId),
        isNull(schema.provider.deletedAt)
      )
    )
    .limit(1);

  if (prov) return true;

  const [assign] = await db
    .select({ id: schema.providerAssignment.id })
    .from(schema.providerAssignment)
    .where(
      and(
        eq(schema.providerAssignment.metierId, metierId),
        isNull(schema.providerAssignment.deletedAt)
      )
    )
    .limit(1);

  return Boolean(assign);
}
