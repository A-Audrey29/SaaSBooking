import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listProjectAssignments(projectId: string) {
  return db
    .select({
      id: schema.providerAssignment.id,
      role: schema.providerAssignment.role,
      createdAt: schema.providerAssignment.createdAt,
      providerId: schema.provider.id,
      providerNom: schema.provider.nom,
      providerEmail: schema.provider.email,
      providerSpecialite: schema.provider.specialite,
    })
    .from(schema.providerAssignment)
    .innerJoin(schema.provider, eq(schema.providerAssignment.providerId, schema.provider.id))
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
      specialite: schema.provider.specialite,
    })
    .from(schema.provider)
    .where(isNull(schema.provider.deletedAt))
    .orderBy(schema.provider.nom);
}
