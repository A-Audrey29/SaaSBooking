"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  getWorkshopWithType,
  getRoleGroupsForWorkshopType,
} from "@/server/queries/session-group";
import {
  CreateSessionGroupSchema,
  type CreateSessionGroupInput,
} from "@/server/validations/session-group";

export async function fetchRoleGroups(workshopTypeId: string) {
  await requireRole("referent");
  return getRoleGroupsForWorkshopType(workshopTypeId);
}

export async function createSessionGroup(
  input: CreateSessionGroupInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("referent");
    const validated = CreateSessionGroupSchema.parse(input);

    if (!ctx.centreId) throw new Error("Compte sans centre associé");

    const workshop = await getWorkshopWithType(validated.workshopId);
    if (!workshop) throw new Error("Atelier introuvable");
    if (workshop.centreId !== null && workshop.centreId !== ctx.centreId) {
      throw new Error("Atelier non autorisé pour ce centre");
    }

    // Load slots for the chosen group to get metier names + is_optional
    const slots = await db.query.workshopRoleSlot.findMany({
      where: (wrs, { eq, isNull, and }) =>
        and(
          eq(wrs.workshopRoleGroupId, validated.workshopRoleGroupId),
          isNull(wrs.deletedAt)
        ),
      with: {
        metier: { columns: { nom: true } },
      },
    });

    if (slots.length === 0) throw new Error("Groupe de rôles introuvable ou vide");

    const checkedSet = new Set(validated.checkedSlotIds);

    const sessionGroupId = await db.transaction(async (tx) => {
      const [sg] = await tx
        .insert(schema.sessionGroup)
        .values({
          workshopId: validated.workshopId,
          centreId: ctx.centreId!,
          nom: validated.nom,
          sessionNumber: validated.sessionNumber,
          seanceNumber: validated.seanceNumber,
          notes: validated.notes ?? null,
          createdBy: ctx.userId,
        })
        .returning({ id: schema.sessionGroup.id });

      // Crée 1 occurrence — index = numéro de séance saisi par le référent
      const [occ] = await tx
        .insert(schema.occurrence)
        .values({
          sessionGroupId: sg.id,
          index: validated.seanceNumber,
          statut: "planned",
          workshopRoleGroupId: validated.workshopRoleGroupId,
        })
        .returning({ id: schema.occurrence.id });

      const [tkt] = await tx
        .insert(schema.ticket)
        .values({
          occurrenceId: occ.id,
          statut: "empty",
        })
        .returning({ id: schema.ticket.id });

      for (const slot of slots) {
        const isChecked = checkedSet.has(slot.id);
        const isRequired = !slot.isOptional;

        if (isChecked) {
          await tx.insert(schema.ticketSlot).values({
            ticketId: tkt.id,
            providerRole: slot.metier.nom,
            workshopRoleSlotId: slot.id,
            statut: "empty",
          });
        } else if (isRequired) {
          // Requis mais décoché → skipped
          await tx.insert(schema.ticketSlot).values({
            ticketId: tkt.id,
            providerRole: slot.metier.nom,
            workshopRoleSlotId: slot.id,
            statut: "skipped",
          });
        }
        // Optionnel non coché → pas de ticket_slot créé
      }

      await logAudit(ctx, "create", "session_group", sg.id, null, {
        workshopId: validated.workshopId,
        workshopRoleGroupId: validated.workshopRoleGroupId,
        nom: validated.nom,
        sessionNumber: validated.sessionNumber,
        seanceNumber: validated.seanceNumber,
      });

      return sg.id;
    });

    revalidatePath("/app");
    return { ok: true, id: sessionGroupId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
