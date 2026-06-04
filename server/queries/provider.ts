import { eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

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
