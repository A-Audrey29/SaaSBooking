"use server";

import { requireRole } from "@/server/context/server-context";
import { createAvailability, deleteAvailability } from "@/server/mutations/provider-availability";
import {
  CreateAvailabilitySchema,
  DeleteAvailabilitySchema,
  type CreateAvailabilityInput,
  type DeleteAvailabilityInput,
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
