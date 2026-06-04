import "server-only";

import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listWorkshopsForCentre(centreId: string) {
  return db
    .select({
      id: schema.workshop.id,
      nom: schema.workshop.nom,
      seancesCount: schema.workshop.seancesCount,
      durationMin: schema.workshop.durationMin,
      typeId: schema.workshop.typeId,
      typeNom: schema.workshopType.nom,
    })
    .from(schema.workshop)
    .innerJoin(
      schema.project,
      and(
        eq(schema.workshop.projectId, schema.project.id),
        isNull(schema.project.deletedAt)
      )
    )
    .leftJoin(schema.workshopType, eq(schema.workshop.typeId, schema.workshopType.id))
    .where(
      and(
        eq(schema.project.centreId, centreId),
        isNull(schema.workshop.deletedAt)
      )
    )
    .orderBy(schema.workshop.nom);
}

export async function getRoleGroupsForWorkshopType(workshopTypeId: string) {
  const groups = await db.query.workshopRoleGroup.findMany({
    where: (wrg, { eq, isNull, and }) =>
      and(eq(wrg.workshopTypeId, workshopTypeId), isNull(wrg.deletedAt)),
    orderBy: (wrg, { asc }) => [asc(wrg.ordre)],
    with: {
      workshopRoleSlots: {
        where: (wrs, { isNull }) => isNull(wrs.deletedAt),
        orderBy: (wrs, { asc }) => [asc(wrs.ordre)],
        with: {
          metier: {
            columns: { id: true, nom: true },
          },
        },
      },
    },
  });

  return groups;
}

export async function getWorkshopWithType(workshopId: string) {
  const [row] = await db
    .select({
      id: schema.workshop.id,
      nom: schema.workshop.nom,
      seancesCount: schema.workshop.seancesCount,
      durationMin: schema.workshop.durationMin,
      typeId: schema.workshop.typeId,
      typeNom: schema.workshopType.nom,
      projectCentreId: schema.project.centreId,
    })
    .from(schema.workshop)
    .innerJoin(schema.project, eq(schema.workshop.projectId, schema.project.id))
    .leftJoin(schema.workshopType, eq(schema.workshop.typeId, schema.workshopType.id))
    .where(eq(schema.workshop.id, workshopId));

  return row ?? null;
}
