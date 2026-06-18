"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { updateTicketSlotStatut } from "@/server/mutations/ticket-slot";
import { logAudit } from "@/server/queries/audit";
import { getWorkshopWithType } from "@/server/queries/session-group";

const CartSlotSchema = z.object({
  // En mode "new", ticketSlotId est le nom du métier (providerRole) car pas encore en DB
  ticketSlotId: z.string(),
  providerId: z.string().uuid(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  // Présent uniquement en mode "new"
  providerRole: z.string().optional(),
});

const NewSessionParamsSchema = z.object({
  workshopId: z.string().uuid(),
  workshopRoleGroupId: z.string().uuid(),
  checkedSlotIds: z.array(z.string().uuid()).min(1),
  nom: z.string().min(1).max(200),
  sessionNumber: z.number().int().min(1),
  seanceNumber: z.number().int().min(1),
  notes: z.string().optional(),
});

const SendCartRequestsSchema = z.union([
  // Mode "existing" : session_group déjà en DB
  z.object({
    mode: z.literal("existing"),
    sessionGroupId: z.string().uuid(),
    slots: z.array(CartSlotSchema).min(1),
  }),
  // Mode "new" : création différée — tout se crée à l'envoi
  z.object({
    mode: z.literal("new"),
    newSessionParams: NewSessionParamsSchema,
    slots: z.array(CartSlotSchema).min(1),
  }),
]);

type SendCartInput = z.infer<typeof SendCartRequestsSchema>;
type ActionResult = { ok: true; sessionGroupId: string } | { ok: false; error: string };

/**
 * Finalise le panier du référent.
 *
 * Mode "existing" : session_group existe déjà — fixe dates + passe pending.
 * Mode "new"      : crée session_group + occurrence + ticket_slots + passe pending
 *                   en une transaction atomique.
 */
export async function sendCartRequests(input: SendCartInput): Promise<ActionResult> {
  try {
    const ctx = await requireRole("referent");
    if (!ctx.centreId) return { ok: false, error: "Compte sans centre associé" };

    const parsed = SendCartRequestsSchema.parse(input);

    // Toutes les slots doivent partager le même créneau
    const uniqueStarts = new Set(parsed.slots.map((s) => s.startAt.getTime()));
    if (uniqueStarts.size > 1) {
      return { ok: false, error: "Tous les prestataires doivent être planifiés au même créneau" };
    }

    if (parsed.mode === "new") {
      return await handleNewSession(parsed, ctx);
    } else {
      return await handleExistingSession(parsed, ctx);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

// ── Mode "existing" ───────────────────────────────────────────────────────────

async function handleExistingSession(
  parsed: Extract<SendCartInput, { mode: "existing" }>,
  ctx: Awaited<ReturnType<typeof requireRole>>
): Promise<ActionResult> {
  const { sessionGroupId, slots } = parsed;

  const [sg] = await db
    .select({ centreId: schema.sessionGroup.centreId })
    .from(schema.sessionGroup)
    .where(eq(schema.sessionGroup.id, sessionGroupId));

  if (!sg) return { ok: false, error: "Séance introuvable" };
  if (sg.centreId !== ctx.centreId) return { ok: false, error: "Accès non autorisé" };

  for (const slot of slots) {
    const [chain] = await db
      .select({
        occurrenceId: schema.occurrence.id,
        occurrenceStatut: schema.occurrence.statut,
      })
      .from(schema.ticketSlot)
      .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
      .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
      .where(eq(schema.ticketSlot.id, slot.ticketSlotId));

    if (!chain) continue;

    if (chain.occurrenceStatut !== "confirmed" && chain.occurrenceStatut !== "done") {
      await db
        .update(schema.occurrence)
        .set({ startAt: slot.startAt, endAt: slot.endAt, updatedAt: new Date() })
        .where(eq(schema.occurrence.id, chain.occurrenceId));
    }

    await updateTicketSlotStatut(
      { slotId: slot.ticketSlotId, newStatut: "pending", providerId: slot.providerId },
      ctx
    );
  }

  revalidatePath(`/app/sessions/${sessionGroupId}`);
  revalidatePath("/app/availability");
  return { ok: true, sessionGroupId };
}

// ── Mode "new" — création atomique + pending ──────────────────────────────────

async function handleNewSession(
  parsed: Extract<SendCartInput, { mode: "new" }>,
  ctx: Awaited<ReturnType<typeof requireRole>>
): Promise<ActionResult> {
  const { newSessionParams: np, slots } = parsed;

  const workshop = await getWorkshopWithType(np.workshopId);
  if (!workshop) return { ok: false, error: "Atelier introuvable" };
  if (workshop.centreId !== null && workshop.centreId !== ctx.centreId) {
    return { ok: false, error: "Atelier non autorisé pour ce centre" };
  }

  // Charger les slots du groupe
  const roleSlots = await db
    .select({
      id: schema.workshopRoleSlot.id,
      isOptional: schema.workshopRoleSlot.isOptional,
      metierNom: schema.metier.nom,
    })
    .from(schema.workshopRoleSlot)
    .innerJoin(schema.metier, eq(schema.workshopRoleSlot.metierId, schema.metier.id))
    .where(
      and(
        eq(schema.workshopRoleSlot.workshopRoleGroupId, np.workshopRoleGroupId),
        isNull(schema.workshopRoleSlot.deletedAt)
      )
    );

  if (roleSlots.length === 0) return { ok: false, error: "Groupe de rôles introuvable ou vide" };

  const checkedSet = new Set(np.checkedSlotIds);
  const firstSlot = slots[0];

  const sessionGroupId = await db.transaction(async (tx) => {
    const [sg] = await tx
      .insert(schema.sessionGroup)
      .values({
        workshopId: np.workshopId,
        centreId: ctx.centreId!,
        nom: np.nom,
        sessionNumber: np.sessionNumber,
        seanceNumber: np.seanceNumber,
        notes: np.notes ?? null,
        createdBy: ctx.userId,
      })
      .returning({ id: schema.sessionGroup.id });

    const [occ] = await tx
      .insert(schema.occurrence)
      .values({
        sessionGroupId: sg.id,
        index: np.seanceNumber,
        statut: "planned",
        workshopRoleGroupId: np.workshopRoleGroupId,
        startAt: firstSlot.startAt,
        endAt: firstSlot.endAt,
      })
      .returning({ id: schema.occurrence.id });

    const [tkt] = await tx
      .insert(schema.ticket)
      .values({ occurrenceId: occ.id, statut: "empty" })
      .returning({ id: schema.ticket.id });

    // Créer les ticket_slots : cochés → empty puis pending, requis non-cochés → skipped
    const ticketSlotIds: { metierNom: string; id: string }[] = [];
    for (const rs of roleSlots) {
      const isChecked = checkedSet.has(rs.id);
      if (isChecked) {
        const [ts] = await tx
          .insert(schema.ticketSlot)
          .values({ ticketId: tkt.id, providerRole: rs.metierNom, workshopRoleSlotId: rs.id, statut: "empty" })
          .returning({ id: schema.ticketSlot.id });
        ticketSlotIds.push({ metierNom: rs.metierNom, id: ts.id });
      } else if (!rs.isOptional) {
        await tx.insert(schema.ticketSlot).values({
          ticketId: tkt.id,
          providerRole: rs.metierNom,
          workshopRoleSlotId: rs.id,
          statut: "skipped",
        });
      }
    }

    // Passer les slots sélectionnés en pending
    for (const slot of slots) {
      const ts = ticketSlotIds.find((t) => t.metierNom === slot.providerRole);
      if (!ts) continue;
      await tx
        .update(schema.ticketSlot)
        .set({ statut: "pending", providerId: slot.providerId, sentAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.ticketSlot.id, ts.id));
    }

    await logAudit(ctx, "create", "session_group", sg.id, null, {
      workshopId: np.workshopId,
      workshopRoleGroupId: np.workshopRoleGroupId,
      nom: np.nom,
      sessionNumber: np.sessionNumber,
      seanceNumber: np.seanceNumber,
    });

    return sg.id;
  });

  revalidatePath("/app/sessions");
  revalidatePath("/app/availability");
  return { ok: true, sessionGroupId };
}
