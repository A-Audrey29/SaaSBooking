import "server-only";

import { eq, isNull, and, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import type { ServerContext } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";

export type TicketSlotStatut =
  | "empty"
  | "pending"
  | "confirmed"
  | "refused"
  | "cancelled"
  | "done"
  | "skipped";

// Terminal statuts — no transition allowed out
const TERMINAL: TicketSlotStatut[] = ["done", "cancelled", "skipped"];

// Allowed transitions in S9 scope (referent actor)
const ALLOWED_TRANSITIONS: Record<string, TicketSlotStatut[]> = {
  empty: ["pending", "skipped"],
  pending: ["empty", "skipped"],
  refused: ["pending", "skipped"],
  confirmed: ["cancelled"], // only via cancelOccurrence cascade, not S9 UI
};

export async function updateTicketSlotStatut(
  params: {
    slotId: string;
    newStatut: TicketSlotStatut;
    providerId?: string; // required for empty → pending
  },
  ctx: ServerContext
): Promise<void> {
  const { slotId, newStatut, providerId } = params;

  await db.transaction(async (tx) => {
    // Fetch slot with occurrence chain for tenant check
    const [row] = await tx
      .select({
        slotId: schema.ticketSlot.id,
        slotStatut: schema.ticketSlot.statut,
        slotDeletedAt: schema.ticketSlot.deletedAt,
        ticketId: schema.ticket.id,
        occurrenceId: schema.occurrence.id,
        occurrenceStatut: schema.occurrence.statut,
        centreId: schema.sessionGroup.centreId,
      })
      .from(schema.ticketSlot)
      .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
      .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
      .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
      .where(eq(schema.ticketSlot.id, slotId));

    if (!row) throw new Error("Slot introuvable");
    if (row.slotDeletedAt) throw new Error("Slot supprimé");
    if (row.centreId !== ctx.centreId) throw new Error("Accès non autorisé");

    const currentStatut = row.slotStatut as TicketSlotStatut;

    // Check terminal
    if ((TERMINAL as string[]).includes(currentStatut)) {
      throw new Error(`Transition interdite : ${currentStatut} est terminal`);
    }

    // Check allowed
    const allowed = ALLOWED_TRANSITIONS[currentStatut] ?? [];
    if (!allowed.includes(newStatut)) {
      throw new Error(`Transition interdite : ${currentStatut} → ${newStatut}`);
    }

    // Validate params
    if (newStatut === "pending" && !providerId) {
      throw new Error("providerId requis pour la transition empty → pending");
    }

    // Build update payload
    const updateValues: Partial<typeof schema.ticketSlot.$inferInsert> & { updatedAt: Date } = {
      statut: newStatut,
      updatedAt: new Date(),
    };

    if (newStatut === "pending") {
      updateValues.providerId = providerId;
      updateValues.sentAt = new Date();
    }

    if (newStatut === "empty") {
      // providerId conservé intentionnellement : le prestataire doit voir la demande
      // annulée dans /pro/missions (badge "Annulée") jusqu'à ce qu'il la dismiss.
      // sent_at conservé pour audit.
    }

    if (newStatut === "skipped" && currentStatut === "pending") {
      updateValues.providerId = null;
    }

    await tx
      .update(schema.ticketSlot)
      .set(updateValues)
      .where(eq(schema.ticketSlot.id, slotId));

    await recomputeOccurrenceStatut(row.occurrenceId, tx);

    await logAudit(ctx, "update", "ticket_slot", slotId, { statut: currentStatut }, { statut: newStatut });
  });
}

async function recomputeOccurrenceStatut(
  occurrenceId: string,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<void> {
  // Check if occurrence is already cancelled (frozen)
  const [occ] = await tx
    .select({ statut: schema.occurrence.statut })
    .from(schema.occurrence)
    .where(eq(schema.occurrence.id, occurrenceId));

  if (!occ || occ.statut === "cancelled") return;

  // Fetch all non-deleted ticket_slots for this occurrence
  const slots = await tx
    .select({ statut: schema.ticketSlot.statut })
    .from(schema.ticketSlot)
    .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
    .where(
      and(
        eq(schema.ticket.occurrenceId, occurrenceId),
        isNull(schema.ticketSlot.deletedAt),
        isNull(schema.ticket.deletedAt)
      )
    );

  // Active slots = not skipped, not cancelled
  const activeSlots = slots.filter(
    (s) => s.statut !== "skipped" && s.statut !== "cancelled"
  );

  let newStatut: "planned" | "confirmed" | "completed";

  if (activeSlots.length === 0) {
    // All skipped/cancelled — stays planned
    newStatut = "planned";
  } else if (activeSlots.every((s) => s.statut === "done")) {
    newStatut = "completed";
  } else if (activeSlots.every((s) => s.statut === "confirmed" || s.statut === "done")) {
    newStatut = "confirmed";
  } else {
    newStatut = "planned";
  }

  await tx
    .update(schema.occurrence)
    .set({ statut: newStatut, updatedAt: new Date() })
    .where(eq(schema.occurrence.id, occurrenceId));
}
