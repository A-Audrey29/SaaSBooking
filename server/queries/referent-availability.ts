import "server-only";

import { eq, isNull, and, inArray, lte, gte, asc, lt, gt } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export interface ProviderDispoRow {
  providerId: string;
  providerNom: string;
  metierNom: string;
  availabilities: {
    id: string;
    startAt: Date;
    endAt: Date;
    kind: string;
  }[];
}

/**
 * Retourne tous les prestataires actifs filtrés optionnellement par noms de
 * métier, avec leurs disponibilités dans [from, to].
 *
 * En V1 les prestataires ne sont pas contraints à un centre : ils peuvent
 * opérer sur toute la Guadeloupe. On filtre uniquement par métier.
 */
export async function getProvidersDisposForCentre(
  _centreId: string,
  from: Date,
  to: Date,
  metierNoms?: string[]
): Promise<ProviderDispoRow[]> {
  // 1. Prestataires actifs, filtrés par métier si précisé
  const providerWhere = metierNoms && metierNoms.length > 0
    ? and(isNull(schema.provider.deletedAt), inArray(schema.metier.nom, metierNoms))
    : isNull(schema.provider.deletedAt);

  const providers = await db
    .select({
      providerId: schema.provider.id,
      providerNom: schema.provider.nom,
      metierNom: schema.metier.nom,
    })
    .from(schema.provider)
    .innerJoin(schema.metier, eq(schema.provider.metierId, schema.metier.id))
    .where(providerWhere)
    .orderBy(schema.metier.nom, schema.provider.nom);

  if (providers.length === 0) return [];

  const providerIds = providers.map((p) => p.providerId);

  // 2. Dispos dans la fenêtre [from, to]
  const dispos = await db
    .select({
      id: schema.providerAvailability.id,
      providerId: schema.providerAvailability.providerId,
      startAt: schema.providerAvailability.startAt,
      endAt: schema.providerAvailability.endAt,
      kind: schema.providerAvailability.kind,
    })
    .from(schema.providerAvailability)
    .where(
      and(
        inArray(schema.providerAvailability.providerId, providerIds),
        isNull(schema.providerAvailability.deletedAt),
        lte(schema.providerAvailability.startAt, to),
        gte(schema.providerAvailability.endAt, from)
      )
    )
    .orderBy(asc(schema.providerAvailability.startAt));

  // 3. Assembler
  const disposByProvider = new Map<string, typeof dispos>();
  for (const d of dispos) {
    const list = disposByProvider.get(d.providerId) ?? [];
    list.push(d);
    disposByProvider.set(d.providerId, list);
  }

  return providers.map((p) => ({
    providerId: p.providerId,
    providerNom: p.providerNom,
    metierNom: p.metierNom ?? "",
    availabilities: disposByProvider.get(p.providerId) ?? [],
  }));
}

// ── Types panier ──────────────────────────────────────────────────────────────

export interface CartTicketSlot {
  ticketSlotId: string;
  providerRole: string; // = metierNom
  statut: string;
  providerId: string | null;
}

export interface CartOccurrence {
  occurrenceId: string;
  index: number;
  statut: string;
  startAt: Date | null;
  endAt: Date | null;
  ticketSlots: CartTicketSlot[];
}

export interface SessionGroupCart {
  id: string;
  nom: string;
  occurrences: CartOccurrence[];
  /** Métiers distincts requis (providerRole non-skipped) */
  requiredRoles: string[];
}

/**
 * Charge le contexte d'une séance pour le panier du référent :
 * occurrences + ticket_slots actifs.
 */
export async function getSessionGroupForCart(
  sessionGroupId: string,
  centreId: string
): Promise<SessionGroupCart | null> {
  const [sg] = await db
    .select({ id: schema.sessionGroup.id, nom: schema.sessionGroup.nom, centreId: schema.sessionGroup.centreId })
    .from(schema.sessionGroup)
    .where(and(eq(schema.sessionGroup.id, sessionGroupId), isNull(schema.sessionGroup.deletedAt)));

  if (!sg || sg.centreId !== centreId) return null;

  // Occurrences avec leurs tickets + slots
  const rows = await db
    .select({
      occurrenceId: schema.occurrence.id,
      occurrenceIndex: schema.occurrence.index,
      occurrenceStatut: schema.occurrence.statut,
      occurrenceStartAt: schema.occurrence.startAt,
      occurrenceEndAt: schema.occurrence.endAt,
      ticketSlotId: schema.ticketSlot.id,
      providerRole: schema.ticketSlot.providerRole,
      slotStatut: schema.ticketSlot.statut,
      slotProviderId: schema.ticketSlot.providerId,
    })
    .from(schema.occurrence)
    .innerJoin(
      schema.ticket,
      and(eq(schema.ticket.occurrenceId, schema.occurrence.id), isNull(schema.ticket.deletedAt))
    )
    .innerJoin(
      schema.ticketSlot,
      and(eq(schema.ticketSlot.ticketId, schema.ticket.id), isNull(schema.ticketSlot.deletedAt))
    )
    .where(
      and(
        eq(schema.occurrence.sessionGroupId, sessionGroupId),
        isNull(schema.occurrence.deletedAt)
      )
    )
    .orderBy(asc(schema.occurrence.index));

  // Assembler par occurrence
  const occMap = new Map<string, CartOccurrence>();
  for (const r of rows) {
    if (!occMap.has(r.occurrenceId)) {
      occMap.set(r.occurrenceId, {
        occurrenceId: r.occurrenceId,
        index: r.occurrenceIndex,
        statut: r.occurrenceStatut,
        startAt: r.occurrenceStartAt ?? null,
        endAt: r.occurrenceEndAt ?? null,
        ticketSlots: [],
      });
    }
    occMap.get(r.occurrenceId)!.ticketSlots.push({
      ticketSlotId: r.ticketSlotId,
      providerRole: r.providerRole,
      statut: r.slotStatut,
      providerId: r.slotProviderId ?? null,
    });
  }

  const occurrences = Array.from(occMap.values());

  // Rôles requis = providerRoles distincts non-skipped sur la première occurrence sans date
  const firstUnscheduled = occurrences.find((o) => !o.startAt) ?? occurrences[0];
  const requiredRoles = firstUnscheduled
    ? [...new Set(
        firstUnscheduled.ticketSlots
          .filter((s) => s.statut !== "skipped" && s.statut !== "cancelled")
          .map((s) => s.providerRole)
      )]
    : [];

  return { id: sg.id, nom: sg.nom, occurrences, requiredRoles };
}

/**
 * Retourne les prestataires ayant une dispo `available` qui chevauche [startAt, endAt]
 * pour un métier donné.
 * Chevauchement : dispo.startAt < endAt AND dispo.endAt > startAt
 */
export async function getProvidersAvailableForSlot(
  metierNom: string,
  startAt: Date,
  endAt: Date
): Promise<{ providerId: string; providerNom: string; ville: string | null }[]> {
  const rows = await db
    .select({
      providerId: schema.provider.id,
      providerNom: schema.provider.nom,
      ville: schema.provider.ville,
    })
    .from(schema.provider)
    .innerJoin(schema.metier, eq(schema.provider.metierId, schema.metier.id))
    .innerJoin(
      schema.providerAvailability,
      and(
        eq(schema.providerAvailability.providerId, schema.provider.id),
        eq(schema.providerAvailability.kind, "available"),
        isNull(schema.providerAvailability.deletedAt),
        lt(schema.providerAvailability.startAt, endAt),
        gt(schema.providerAvailability.endAt, startAt)
      )
    )
    .where(
      and(
        eq(schema.metier.nom, metierNom),
        isNull(schema.provider.deletedAt),
        isNull(schema.metier.deletedAt)
      )
    )
    .orderBy(schema.provider.nom);

  // Dédoublonner (un prestataire peut avoir plusieurs dispos qui chevauchent)
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.providerId)) return false;
    seen.add(r.providerId);
    return true;
  });
}
