import "server-only";

import { eq, isNull, and, gte, lte, asc } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function getOccurrencesForCentre(centreId: string, from: Date, to: Date) {
  return db
    .select({
      id: schema.occurrence.id,
      startAt: schema.occurrence.startAt,
      endAt: schema.occurrence.endAt,
      statut: schema.occurrence.statut,
      sessionGroupId: schema.sessionGroup.id,
      sessionNom: schema.sessionGroup.nom,
    })
    .from(schema.occurrence)
    .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
    .where(
      and(
        eq(schema.sessionGroup.centreId, centreId),
        gte(schema.occurrence.startAt, from),
        lte(schema.occurrence.startAt, to),
        isNull(schema.occurrence.deletedAt),
        isNull(schema.sessionGroup.deletedAt)
      )
    )
    .orderBy(asc(schema.occurrence.startAt));
}

export type OccurrenceCalendarRow = Awaited<ReturnType<typeof getOccurrencesForCentre>>[number];
