"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/context/server-context";
import { updateTicketSlotStatut } from "@/server/mutations/ticket-slot";
import { getProvidersForSlot } from "@/server/queries/ticket-slot";
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
    await updateTicketSlotStatut({ slotId, newStatut: "empty" }, ctx);
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
