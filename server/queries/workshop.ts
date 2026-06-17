import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listWorkshopsForProject(projectId: string) {
  return db
    .select({
      id: schema.workshop.id,
      nom: schema.workshop.nom,
      description: schema.workshop.description,
      seancesCount: schema.workshop.seancesCount,
      durationMin: schema.workshop.durationMin,
      centreId: schema.workshop.centreId,
      typeId: schema.workshop.typeId,
      typeNom: schema.workshopType.nom,
    })
    .from(schema.workshop)
    .leftJoin(schema.workshopType, eq(schema.workshop.typeId, schema.workshopType.id))
    .where(
      and(
        eq(schema.workshop.projectId, projectId),
        isNull(schema.workshop.deletedAt)
      )
    )
    .orderBy(schema.workshop.nom);
}

export type WorkshopListItem = Awaited<ReturnType<typeof listWorkshopsForProject>>[number];

export async function listAllWorkshopTypes() {
  return db
    .select({
      id: schema.workshopType.id,
      nom: schema.workshopType.nom,
      code: schema.workshopType.code,
    })
    .from(schema.workshopType)
    .where(isNull(schema.workshopType.deletedAt))
    .orderBy(schema.workshopType.nom);
}

export async function isWorkshopInUse(workshopId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.sessionGroup.id })
    .from(schema.sessionGroup)
    .where(
      and(
        eq(schema.sessionGroup.workshopId, workshopId),
        isNull(schema.sessionGroup.deletedAt)
      )
    )
    .limit(1);

  return row !== undefined;
}
