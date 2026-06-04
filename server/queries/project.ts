import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listProjects(centreId: string) {
  return db
    .select({
      id: schema.project.id,
      centreId: schema.project.centreId,
      nom: schema.project.nom,
      description: schema.project.description,
      financeur: schema.project.financeur,
      startDate: schema.project.startDate,
      endDate: schema.project.endDate,
      createdAt: schema.project.createdAt,
    })
    .from(schema.project)
    .where(and(eq(schema.project.centreId, centreId), isNull(schema.project.deletedAt)))
    .orderBy(schema.project.nom);
}

export async function listAllProjects() {
  return db
    .select({
      id: schema.project.id,
      centreId: schema.project.centreId,
      centreNom: schema.centre.nom,
      nom: schema.project.nom,
      description: schema.project.description,
      financeur: schema.project.financeur,
      startDate: schema.project.startDate,
      endDate: schema.project.endDate,
      createdAt: schema.project.createdAt,
    })
    .from(schema.project)
    .innerJoin(schema.centre, eq(schema.project.centreId, schema.centre.id))
    .where(isNull(schema.project.deletedAt))
    .orderBy(schema.centre.nom, schema.project.nom);
}
