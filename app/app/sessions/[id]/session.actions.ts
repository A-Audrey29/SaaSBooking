"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, type ServerContext } from "@/server/context/server-context";
import { updateTicketSlotStatut } from "@/server/mutations/ticket-slot";
import { getProvidersForSlot } from "@/server/queries/ticket-slot";
import { getProviderById } from "@/server/queries/provider";
import { buildCancellationEmail, sendCancellationEmail } from "@/server/emails/send-cancellation";
import type { EmailPreviewResult } from "@/server/lib/email";
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

/**
 * Data of the cancellation email for a slot, or null if no email will be sent
 * (no provider on the slot). Shared by the preview and the real cancellation
 * so both always target the same provider with the same text.
 * Not exported → not callable as a server action.
 */
async function loadCancellationEmailParams(slotId: string, ctx: ServerContext) {
  const [slotRow] = await db
    .select({
      providerId: schema.ticketSlot.providerId,
      sessionNom: schema.sessionGroup.nom,
      startAt: schema.occurrence.startAt,
      centreId: schema.sessionGroup.centreId,
    })
    .from(schema.ticketSlot)
    .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
    .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
    .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
    .where(eq(schema.ticketSlot.id, slotId));

  if (!slotRow) throw new Error("Slot introuvable");
  // Same rule as updateTicketSlotStatut: a referent only acts on its own centre
  if (slotRow.centreId !== ctx.centreId) throw new Error("Accès non autorisé");
  if (!slotRow.providerId) return null;

  const provider = await getProviderById(slotRow.providerId);
  if (!provider) return null;

  return {
    to: provider.email,
    providerName: provider.nom,
    sessionNom: slotRow.sessionNom,
    occurrenceDate: slotRow.startAt,
  };
}

/** Read-only: cancellation email that cancelSlotRequest() will send. */
export async function previewCancellationEmail(
  input: CancelRequestInput
): Promise<EmailPreviewResult> {
  try {
    const ctx = await requireRole("referent");
    const { slotId } = CancelRequestSchema.parse(input);
    const params = await loadCancellationEmailParams(slotId, ctx);
    if (!params) return { ok: true, preview: null };

    const { subject, text } = buildCancellationEmail(params);
    return { ok: true, preview: { to: params.to, subject, text } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function cancelSlotRequest(input: CancelRequestInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("referent");
    const { slotId, sessionGroupId } = CancelRequestSchema.parse(input);

    // Read email data before mutation (slot still has providerId)
    const emailParams = await loadCancellationEmailParams(slotId, ctx);

    await updateTicketSlotStatut({ slotId, newStatut: "empty" }, ctx);

    // Send email notification to provider (non-blocking — failure doesn't fail the action)
    if (emailParams) {
      await sendCancellationEmail(emailParams);
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
