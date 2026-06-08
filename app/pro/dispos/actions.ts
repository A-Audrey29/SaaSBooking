"use server";

import { requireRole } from "@/server/context/server-context";
import {
  createAvailability,
  deleteAvailability,
  createRecurringAvailabilities,
} from "@/server/mutations/provider-availability";
import {
  CreateAvailabilitySchema,
  DeleteAvailabilitySchema,
  CreateRecurringAvailabilitiesSchema,
  type CreateAvailabilityInput,
  type DeleteAvailabilityInput,
  type CreateRecurringAvailabilitiesInput,
} from "@/server/validations/provider-availability";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createAvailabilityAction(input: CreateAvailabilityInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("provider");
    const parsed = CreateAvailabilitySchema.parse(input);
    await createAvailability(parsed, ctx);
    revalidatePath("/pro/dispos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

export async function deleteAvailabilityAction(input: DeleteAvailabilityInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("provider");
    const parsed = DeleteAvailabilitySchema.parse(input);
    await deleteAvailability(parsed, ctx);
    revalidatePath("/pro/dispos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

type RecurringResult =
  | { ok: true; created: number; deleted: number }
  | { ok: false; error: string };

export async function createRecurringAvailabilitiesAction(
  input: CreateRecurringAvailabilitiesInput
): Promise<RecurringResult> {
  try {
    const ctx = await requireRole("provider");
    const parsed = CreateRecurringAvailabilitiesSchema.parse(input);
    const { created, deleted } = await createRecurringAvailabilities(parsed, ctx);
    revalidatePath("/pro/dispos");
    return { ok: true, created, deleted };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
