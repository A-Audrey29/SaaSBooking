import "server-only";

import { eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function getProviderById(providerId: string) {
  const [row] = await db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      email: schema.provider.email,
    })
    .from(schema.provider)
    .where(eq(schema.provider.id, providerId));
  return row ?? null;
}

export async function getProviderByUserId(userId: string) {
  const [row] = await db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      email: schema.provider.email,
    })
    .from(schema.provider)
    .where(eq(schema.provider.userId, userId));
  return row ?? null;
}

export async function listAllProviders() {
  return db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      email: schema.provider.email,
      telephone: schema.provider.telephone,
      ville: schema.provider.ville,
      metierId: schema.provider.metierId,
      metierNom: schema.metier.nom,
      bio: schema.provider.bio,
      createdAt: schema.provider.createdAt,
    })
    .from(schema.provider)
    .leftJoin(schema.metier, eq(schema.provider.metierId, schema.metier.id))
    .where(isNull(schema.provider.deletedAt))
    .orderBy(schema.provider.nom);
}
