import "server-only";

import { eq, and, isNull, isNotNull, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

/**
 * Demandes en cours (pending) et annulées (empty + sentAt non null) pour un prestataire.
 *
 * Un slot "annulé par le référent" reste visible côté prestataire tant qu'il ne le dismiss pas.
 * Signal : statut = 'empty' AND providerId = moi AND sentAt IS NOT NULL.
 */
export async function getMyPendingAndCancelledSlots(providerId: string) {
  return db
    .select({
      slotId: schema.ticketSlot.id,
      statut: schema.ticketSlot.statut,
      providerRole: schema.ticketSlot.providerRole,
      sentAt: schema.ticketSlot.sentAt,
      startAt: schema.occurrence.startAt,
      endAt: schema.occurrence.endAt,
      occurrenceIndex: schema.occurrence.index,
      sessionGroupId: schema.sessionGroup.id,
      sessionNom: schema.sessionGroup.nom,
      workshopNom: schema.workshop.nom,
    })
    .from(schema.ticketSlot)
    .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
    .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
    .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
    .innerJoin(schema.workshop, eq(schema.sessionGroup.workshopId, schema.workshop.id))
    .where(
      and(
        eq(schema.ticketSlot.providerId, providerId),
        inArray(schema.ticketSlot.statut, ["pending", "empty", "confirmed"]),
        isNotNull(schema.ticketSlot.sentAt),
        isNull(schema.ticketSlot.deletedAt),
        isNull(schema.ticket.deletedAt),
        isNull(schema.occurrence.deletedAt),
        isNull(schema.sessionGroup.deletedAt),
        isNull(schema.workshop.deletedAt)
      )
    )
    .orderBy(schema.occurrence.startAt);
}

export type ProviderMissionRow = Awaited<ReturnType<typeof getMyPendingAndCancelledSlots>>[number];
