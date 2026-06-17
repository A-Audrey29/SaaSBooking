"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/context/server-context";
import { updateTicketSlotStatut } from "@/server/mutations/ticket-slot";
import { getProvidersForSlot } from "@/server/queries/ticket-slot";
import { getProviderById } from "@/server/queries/provider";
import { sendCancellationEmail } from "@/server/emails/send-cancellation";
import { db, schema } from "@/server/db/client";
import {
  AssignProviderSchema,
  CancelRequestSchema,
  SkipSlotSchema,
  type AssignProviderInput,
  type CancelRequestInput,
  type SkipSlotInput,
} from "@/server/validations/ticket-slot";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function assignProviderToSlot(input: AssignProviderInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("referent");
    const { slotId, providerId, sessionGroupId } = AssignProviderSchema.parse(input);
    await updateTicketSlotStatut({ slotId, newStatut: "pending", providerId }, ctx);
    revalidatePath(`/app/sessions/${sessionGroupId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function cancelSlotRequest(input: CancelRequestInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("referent");
    const { slotId, sessionGroupId } = CancelRequestSchema.parse(input);

    // Fetch provider + session info before mutation (slot still has providerId)
    const [slotRow] = await db
      .select({
        providerId: schema.ticketSlot.providerId,
        sessionNom: schema.sessionGroup.nom,
        startAt: schema.occurrence.startAt,
      })
      .from(schema.ticketSlot)
      .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
      .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
      .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
      .where(eq(schema.ticketSlot.id, slotId));

    await updateTicketSlotStatut({ slotId, newStatut: "empty" }, ctx);

    // Send email notification to provider (non-blocking — failure doesn't fail the action)
    if (slotRow?.providerId) {
      const provider = await getProviderById(slotRow.providerId);
      if (provider) {
        await sendCancellationEmail({
          to: provider.email,
          providerName: provider.nom,
          sessionNom: slotRow.sessionNom,
          occurrenceDate: slotRow.startAt,
        });
      }
    }

    revalidatePath(`/app/sessions/${sessionGroupId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function skipSlot(input: SkipSlotInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("referent");
    const { slotId, sessionGroupId } = SkipSlotSchema.parse(input);
    await updateTicketSlotStatut({ slotId, newStatut: "skipped" }, ctx);
    revalidatePath(`/app/sessions/${sessionGroupId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function fetchProvidersForSlot(slotId: string, centreId: string) {
  await requireRole("referent");
  return getProvidersForSlot(slotId, centreId);
}
