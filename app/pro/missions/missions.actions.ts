"use server";

import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/context/server-context";
import { getProviderByUserId } from "@/server/queries/provider";
import { db, schema } from "@/server/db/client";
import { z } from "zod";

const DismissSlotSchema = z.object({ slotId: z.string().uuid() });

type ActionResult = { ok: true } | { ok: false; error: string };

export async function dismissCancelledSlot(input: { slotId: string }): Promise<ActionResult> {
  try {
    const ctx = await requireRole("provider");
    const { slotId } = DismissSlotSchema.parse(input);

    const provider = await getProviderByUserId(ctx.userId);
    if (!provider) return { ok: false, error: "Prestataire introuvable" };

    const [slot] = await db
      .select({
        id: schema.ticketSlot.id,
        statut: schema.ticketSlot.statut,
        providerId: schema.ticketSlot.providerId,
      })
      .from(schema.ticketSlot)
      .where(and(eq(schema.ticketSlot.id, slotId), isNull(schema.ticketSlot.deletedAt)));

    if (!slot) return { ok: false, error: "Demande introuvable" };
    if (slot.providerId !== provider.id) return { ok: false, error: "Accès non autorisé" };
    if (slot.statut !== "empty") return { ok: false, error: "Seules les demandes annulées peuvent être supprimées" };

    await db
      .update(schema.ticketSlot)
      .set({ providerId: null, updatedAt: new Date() })
      .where(eq(schema.ticketSlot.id, slotId));

    revalidatePath("/pro/missions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
