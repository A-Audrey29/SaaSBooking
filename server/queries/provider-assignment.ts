import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listProjectAssignments(projectId: string) {
  return db
    .select({
      id: schema.providerAssignment.id,
      metierId: schema.providerAssignment.metierId,
      metierNom: schema.metier.nom,
      createdAt: schema.providerAssignment.createdAt,
      providerId: schema.provider.id,
      providerNom: schema.provider.nom,
      providerEmail: schema.provider.email,
    })
    .from(schema.providerAssignment)
    .innerJoin(schema.provider, eq(schema.providerAssignment.providerId, schema.provider.id))
    .innerJoin(schema.metier, eq(schema.providerAssignment.metierId, schema.metier.id))
    .where(
      and(
        eq(schema.providerAssignment.projectId, projectId),
        isNull(schema.providerAssignment.deletedAt)
      )
    )
    .orderBy(schema.provider.nom);
}

export async function listAvailableProviders() {
  return db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      metierId: schema.provider.metierId,
      metierNom: schema.metier.nom,
    })
    .from(schema.provider)
    .leftJoin(schema.metier, eq(schema.provider.metierId, schema.metier.id))
    .where(isNull(schema.provider.deletedAt))
    .orderBy(schema.provider.nom);
}
