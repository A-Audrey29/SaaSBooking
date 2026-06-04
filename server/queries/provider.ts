import { isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listAllProviders() {
  return db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      email: schema.provider.email,
      telephone: schema.provider.telephone,
      ville: schema.provider.ville,
      specialite: schema.provider.specialite,
      bio: schema.provider.bio,
      createdAt: schema.provider.createdAt,
    })
    .from(schema.provider)
    .where(isNull(schema.provider.deletedAt))
    .orderBy(schema.provider.nom);
}
