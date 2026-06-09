import "server-only";

import { eq, and, isNull, gte, lte, asc } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

/**
 * Interventions confirmées d'un prestataire sur une fenêtre [from, to].
 *
 * Chaîne : ticket_slot (providerId = moi, statut = 'confirmed')
 *   → ticket → occurrence → session_group → workshop + centre
 *
 * Le centre n'expose pas de contact "référent famille" en V1 ; on remonte
 * l'adresse / téléphone du centre. Le référent reste "—" côté UI.
 */
export async function getMyConfirmedBookings(providerId: string, from: Date, to: Date) {
  return db
    .select({
      ticketSlotId: schema.ticketSlot.id,
      occurrenceId: schema.occurrence.id,
      startAt: schema.occurrence.startAt,
      endAt: schema.occurrence.endAt,
      index: schema.occurrence.index,
      salle: schema.occurrence.salle,
      lieu: schema.occurrence.lieu,
      occurrenceNotes: schema.occurrence.notes,
      sessionGroupId: schema.sessionGroup.id,
      sessionNom: schema.sessionGroup.nom,
      audience: schema.sessionGroup.audience,
      sessionNotes: schema.sessionGroup.notes,
      workshopNom: schema.workshop.nom,
      centreNom: schema.centre.nom,
      centreAdresse: schema.centre.adresse,
      centreTelephone: schema.centre.telephone,
    })
    .from(schema.ticketSlot)
    .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
    .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
    .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
    .innerJoin(schema.workshop, eq(schema.sessionGroup.workshopId, schema.workshop.id))
    .innerJoin(schema.centre, eq(schema.sessionGroup.centreId, schema.centre.id))
    .where(
      and(
        eq(schema.ticketSlot.providerId, providerId),
        eq(schema.ticketSlot.statut, "confirmed"),
        gte(schema.occurrence.startAt, from),
        lte(schema.occurrence.startAt, to),
        isNull(schema.ticketSlot.deletedAt),
        isNull(schema.ticket.deletedAt),
        isNull(schema.occurrence.deletedAt),
        isNull(schema.sessionGroup.deletedAt),
        isNull(schema.workshop.deletedAt),
        isNull(schema.centre.deletedAt)
      )
    )
    .orderBy(asc(schema.occurrence.startAt));
}

export type ProviderBookingRow = Awaited<ReturnType<typeof getMyConfirmedBookings>>[number];

/** Toutes les interventions confirmées du provider, sans filtre date. Utilisé pour protéger les dispos lors d'un purge global. */
export async function getAllMyConfirmedBookings(providerId: string) {
  return db
    .select({
      startAt: schema.occurrence.startAt,
      endAt: schema.occurrence.endAt,
    })
    .from(schema.ticketSlot)
    .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
    .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
    .where(
      and(
        eq(schema.ticketSlot.providerId, providerId),
        eq(schema.ticketSlot.statut, "confirmed"),
        isNull(schema.ticketSlot.deletedAt),
        isNull(schema.ticket.deletedAt),
        isNull(schema.occurrence.deletedAt)
      )
    );
}
