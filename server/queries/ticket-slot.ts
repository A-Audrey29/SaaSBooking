import "server-only";

import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function getProvidersForSlot(slotId: string, centreId: string) {
  // Join path: ticket_slot → ticket → occurrence → session_group → workshop → project → provider_assignment → provider
  const rows = await db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      ville: schema.provider.ville,
      metierId: schema.provider.metierId,
    })
    .from(schema.ticketSlot)
    .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
    .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
    .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
    .innerJoin(schema.workshop, eq(schema.sessionGroup.workshopId, schema.workshop.id))
    .innerJoin(
      schema.providerAssignment,
      and(
        eq(schema.providerAssignment.projectId, schema.workshop.projectId),
        isNull(schema.providerAssignment.deletedAt)
      )
    )
    .innerJoin(
      schema.provider,
      and(
        eq(schema.providerAssignment.providerId, schema.provider.id),
        isNull(schema.provider.deletedAt)
      )
    )
    .where(
      and(
        eq(schema.ticketSlot.id, slotId),
        eq(schema.sessionGroup.centreId, centreId)
      )
    )
    .orderBy(schema.provider.nom);

  return rows;
}

export type ProviderForSlot = Awaited<ReturnType<typeof getProvidersForSlot>>[number];
