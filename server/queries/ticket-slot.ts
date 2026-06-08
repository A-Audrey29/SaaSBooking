import "server-only";

import { eq, isNull, and, lte, gte, isNotNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function getProvidersForSlot(slotId: string, centreId: string) {
  // Join path (BDR-009): métier match via workshopRoleSlotId + availability coverage
  // ticketSlot → ticket → occurrence (dates) → sessionGroup (tenant fence)
  // ticketSlot → workshopRoleSlot (metierId) → provider (metier match) → providerAvailability
  const rows = await db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      ville: schema.provider.ville,
      metierId: schema.provider.metierId,
    })
    .from(schema.ticketSlot)
    .innerJoin(
      schema.ticket,
      and(eq(schema.ticketSlot.ticketId, schema.ticket.id), isNull(schema.ticket.deletedAt))
    )
    .innerJoin(
      schema.occurrence,
      and(eq(schema.ticket.occurrenceId, schema.occurrence.id), isNull(schema.occurrence.deletedAt))
    )
    .innerJoin(
      schema.sessionGroup,
      and(eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id), isNull(schema.sessionGroup.deletedAt))
    )
    .innerJoin(
      schema.workshopRoleSlot,
      and(
        isNotNull(schema.ticketSlot.workshopRoleSlotId),
        eq(schema.ticketSlot.workshopRoleSlotId, schema.workshopRoleSlot.id)
      )
    )
    .innerJoin(
      schema.provider,
      and(
        eq(schema.provider.metierId, schema.workshopRoleSlot.metierId),
        isNull(schema.provider.deletedAt)
      )
    )
    .innerJoin(
      schema.providerAvailability,
      and(
        eq(schema.providerAvailability.providerId, schema.provider.id),
        lte(schema.providerAvailability.startAt, schema.occurrence.startAt),
        gte(schema.providerAvailability.endAt, schema.occurrence.endAt),
        eq(schema.providerAvailability.kind, "available"),
        isNull(schema.providerAvailability.deletedAt)
      )
    )
    .where(
      and(
        eq(schema.ticketSlot.id, slotId),
        eq(schema.sessionGroup.centreId, centreId),
        isNull(schema.ticketSlot.deletedAt)
      )
    )
    .orderBy(schema.provider.nom);

  return rows;
}

export type ProviderForSlot = Awaited<ReturnType<typeof getProvidersForSlot>>[number];
