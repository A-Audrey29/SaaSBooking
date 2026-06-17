"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { updateTicketSlotStatut } from "@/server/mutations/ticket-slot";

const CartSlotSchema = z.object({
  ticketSlotId: z.string().uuid(),
  providerId: z.string().uuid(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
});

const SendCartRequestsSchema = z.object({
  sessionGroupId: z.string().uuid(),
  slots: z.array(CartSlotSchema).min(1),
});

type SendCartInput = z.infer<typeof SendCartRequestsSchema>;
type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Finalise le panier du référent :
 * - Fixe startAt/endAt sur les occurrences concernées
 * - Passe les ticket_slots en "pending" (sentAt = now)
 */
export async function sendCartRequests(input: SendCartInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("referent");
    const { sessionGroupId, slots } = SendCartRequestsSchema.parse(input);

    // Vérifier que le sessionGroup appartient au centre du référent
    const [sg] = await db
      .select({ centreId: schema.sessionGroup.centreId })
      .from(schema.sessionGroup)
      .where(eq(schema.sessionGroup.id, sessionGroupId));

    if (!sg) return { ok: false, error: "Séance introuvable" };
    if (sg.centreId !== ctx.centreId) return { ok: false, error: "Accès non autorisé" };

    for (const slot of slots) {
      // Récupérer l'occurrenceId via ticket_slot → ticket → occurrence
      const [chain] = await db
        .select({
          occurrenceId: schema.occurrence.id,
          occurrenceStartAt: schema.occurrence.startAt,
        })
        .from(schema.ticketSlot)
        .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
        .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
        .where(eq(schema.ticketSlot.id, slot.ticketSlotId));

      if (!chain) continue;

      // Toujours mettre à jour la date — permet de corriger une planification existante
      await db
        .update(schema.occurrence)
        .set({ startAt: slot.startAt, endAt: slot.endAt, updatedAt: new Date() })
        .where(eq(schema.occurrence.id, chain.occurrenceId));

      // Passer le slot en pending
      await updateTicketSlotStatut(
        { slotId: slot.ticketSlotId, newStatut: "pending", providerId: slot.providerId },
        ctx
      );
    }

    revalidatePath(`/app/sessions/${sessionGroupId}`);
    revalidatePath("/app/availability");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
