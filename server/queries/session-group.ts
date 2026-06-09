import "server-only";

import { eq, isNull, and, count, min, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function listWorkshopsForCentre(centreId: string) {
  const workshops = await db
    .select({
      id: schema.workshop.id,
      nom: schema.workshop.nom,
      seancesCount: schema.workshop.seancesCount,
      durationMin: schema.workshop.durationMin,
      typeId: schema.workshop.typeId,
      typeNom: schema.workshopType.nom,
    })
    .from(schema.workshop)
    .innerJoin(
      schema.project,
      and(
        eq(schema.workshop.projectId, schema.project.id),
        isNull(schema.project.deletedAt)
      )
    )
    .leftJoin(schema.workshopType, eq(schema.workshop.typeId, schema.workshopType.id))
    .where(
      and(
        eq(schema.project.centreId, centreId),
        isNull(schema.workshop.deletedAt)
      )
    )
    .orderBy(schema.workshop.nom);

  // Charger les rôles du premier groupe pour chaque typeId distinct
  // pour les afficher dans les cards sans interaction
  const typeIds = [...new Set(workshops.map((w) => w.typeId).filter(Boolean))] as string[];

  const rolesByType = new Map<string, { nom: string; isOptional: boolean; couleur: string | null }[]>();

  if (typeIds.length > 0) {
    for (const typeId of typeIds) {
      const groups = await db.query.workshopRoleGroup.findMany({
        where: (wrg, { eq, isNull, and }) =>
          and(eq(wrg.workshopTypeId, typeId), isNull(wrg.deletedAt)),
        orderBy: (wrg, { asc }) => [asc(wrg.ordre)],
        limit: 1,
        with: {
          workshopRoleSlots: {
            where: (wrs, { isNull }) => isNull(wrs.deletedAt),
            orderBy: (wrs, { asc }) => [asc(wrs.ordre)],
            with: { metier: { columns: { nom: true } } },
          },
        },
      });

      if (groups[0]) {
        rolesByType.set(typeId, groups[0].workshopRoleSlots.map((s) => ({
          nom: s.metier.nom,
          isOptional: s.isOptional,
          couleur: s.couleur,
        })));
      }
    }
  }

  return workshops.map((w) => ({
    ...w,
    defaultRoles: w.typeId ? (rolesByType.get(w.typeId) ?? []) : [],
  }));
}

export type WorkshopForCentre = Awaited<ReturnType<typeof listWorkshopsForCentre>>[number];

export async function getRoleGroupsForWorkshopType(workshopTypeId: string) {
  const groups = await db.query.workshopRoleGroup.findMany({
    where: (wrg, { eq, isNull, and }) =>
      and(eq(wrg.workshopTypeId, workshopTypeId), isNull(wrg.deletedAt)),
    orderBy: (wrg, { asc }) => [asc(wrg.ordre)],
    with: {
      workshopRoleSlots: {
        where: (wrs, { isNull }) => isNull(wrs.deletedAt),
        orderBy: (wrs, { asc }) => [asc(wrs.ordre)],
        with: {
          metier: {
            columns: { id: true, nom: true },
          },
        },
      },
    },
  });

  return groups;
}

export async function listSessionGroupsForCentre(centreId: string) {
  const rows = await db
    .select({
      id: schema.sessionGroup.id,
      nom: schema.sessionGroup.nom,
      centreId: schema.sessionGroup.centreId,
      workshopNom: schema.workshop.nom,
      typeNom: schema.workshopType.nom,
      occurrencesCount: count(schema.occurrence.id),
      prochaineDateAt: min(schema.occurrence.startAt),
    })
    .from(schema.sessionGroup)
    .innerJoin(schema.workshop, eq(schema.sessionGroup.workshopId, schema.workshop.id))
    .leftJoin(schema.workshopType, eq(schema.workshop.typeId, schema.workshopType.id))
    .leftJoin(
      schema.occurrence,
      and(
        eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id),
        isNull(schema.occurrence.deletedAt)
      )
    )
    .where(
      and(
        eq(schema.sessionGroup.centreId, centreId),
        isNull(schema.sessionGroup.deletedAt)
      )
    )
    .groupBy(
      schema.sessionGroup.id,
      schema.sessionGroup.nom,
      schema.sessionGroup.centreId,
      schema.workshop.nom,
      schema.workshopType.nom
    )
    .orderBy(min(schema.occurrence.startAt));

  // Fetch ticket_slot statut counts per session_group
  const slotCounts = await db.execute(sql`
    SELECT
      sg.id AS session_group_id,
      ts.statut,
      COUNT(*)::int AS cnt
    FROM session_group sg
    JOIN occurrence o ON o.session_group_id = sg.id AND o.deleted_at IS NULL
    JOIN ticket t ON t.occurrence_id = o.id AND t.deleted_at IS NULL
    JOIN ticket_slot ts ON ts.ticket_id = t.id AND ts.deleted_at IS NULL
    WHERE sg.centre_id = ${centreId}
      AND sg.deleted_at IS NULL
    GROUP BY sg.id, ts.statut
  `);

  type StatutMap = Record<string, number>;
  const statutsBySg: Record<string, StatutMap> = {};
  for (const row of slotCounts.rows as { session_group_id: string; statut: string; cnt: number }[]) {
    if (!statutsBySg[row.session_group_id]) statutsBySg[row.session_group_id] = {};
    statutsBySg[row.session_group_id][row.statut] = row.cnt;
  }

  return rows.map((r) => {
    const statuts = statutsBySg[r.id] ?? {};
    return {
      ...r,
      statutsAgreges: {
        empty: statuts["empty"] ?? 0,
        pending: statuts["pending"] ?? 0,
        confirmed: statuts["confirmed"] ?? 0,
        refused: statuts["refused"] ?? 0,
        skipped: statuts["skipped"] ?? 0,
        cancelled: statuts["cancelled"] ?? 0,
      },
    };
  });
}

export type SessionGroupListItem = Awaited<ReturnType<typeof listSessionGroupsForCentre>>[number];

export async function getSessionGroupDetail(sessionGroupId: string, centreId: string) {
  // Fetch session_group + workshop + workshopType
  const [sg] = await db
    .select({
      id: schema.sessionGroup.id,
      nom: schema.sessionGroup.nom,
      centreId: schema.sessionGroup.centreId,
      notes: schema.sessionGroup.notes,
      workshopNom: schema.workshop.nom,
      workshopDurationMin: schema.workshop.durationMin,
      typeNom: schema.workshopType.nom,
      workshopProjectId: schema.workshop.projectId,
    })
    .from(schema.sessionGroup)
    .innerJoin(schema.workshop, eq(schema.sessionGroup.workshopId, schema.workshop.id))
    .leftJoin(schema.workshopType, eq(schema.workshop.typeId, schema.workshopType.id))
    .where(
      and(
        eq(schema.sessionGroup.id, sessionGroupId),
        eq(schema.sessionGroup.centreId, centreId),
        isNull(schema.sessionGroup.deletedAt)
      )
    );

  if (!sg) return null;

  // Fetch occurrences
  const occurrences = await db
    .select({
      id: schema.occurrence.id,
      index: schema.occurrence.index,
      startAt: schema.occurrence.startAt,
      endAt: schema.occurrence.endAt,
      lieu: schema.occurrence.lieu,
      salle: schema.occurrence.salle,
      notes: schema.occurrence.notes,
      statut: schema.occurrence.statut,
    })
    .from(schema.occurrence)
    .where(
      and(
        eq(schema.occurrence.sessionGroupId, sessionGroupId),
        isNull(schema.occurrence.deletedAt)
      )
    )
    .orderBy(schema.occurrence.index);

  if (occurrences.length === 0) {
    return { ...sg, occurrences: [] };
  }

  const occurrenceIds = occurrences.map((o) => o.id);

  // Fetch tickets for those occurrences
  const tickets = await db
    .select({ id: schema.ticket.id, occurrenceId: schema.ticket.occurrenceId, statut: schema.ticket.statut })
    .from(schema.ticket)
    .where(and(
      sql`${schema.ticket.occurrenceId} = ANY(${sql`ARRAY[${sql.join(occurrenceIds.map(id => sql`${id}::uuid`), sql`, `)}]`})`,
      isNull(schema.ticket.deletedAt)
    ));

  const ticketIds = tickets.map((t) => t.id);

  // Fetch ticket_slots + provider
  const slots = ticketIds.length === 0 ? [] : await db
    .select({
      id: schema.ticketSlot.id,
      ticketId: schema.ticketSlot.ticketId,
      providerRole: schema.ticketSlot.providerRole,
      statut: schema.ticketSlot.statut,
      sentAt: schema.ticketSlot.sentAt,
      respondedAt: schema.ticketSlot.respondedAt,
      providerId: schema.provider.id,
      providerNom: schema.provider.nom,
      providerVille: schema.provider.ville,
    })
    .from(schema.ticketSlot)
    .leftJoin(schema.provider, eq(schema.ticketSlot.providerId, schema.provider.id))
    .where(
      and(
        sql`${schema.ticketSlot.ticketId} = ANY(${sql`ARRAY[${sql.join(ticketIds.map(id => sql`${id}::uuid`), sql`, `)}]`})`,
        isNull(schema.ticketSlot.deletedAt)
      )
    )
    .orderBy(schema.ticketSlot.createdAt);

  // Index tickets by occurrenceId, slots by ticketId
  const ticketByOccurrence = new Map(tickets.map((t) => [t.occurrenceId, t]));
  const slotsByTicket = new Map<string, typeof slots>();
  for (const slot of slots) {
    const arr = slotsByTicket.get(slot.ticketId) ?? [];
    arr.push(slot);
    slotsByTicket.set(slot.ticketId, arr);
  }

  return {
    ...sg,
    occurrences: occurrences.map((occ) => {
      const ticket = ticketByOccurrence.get(occ.id) ?? null;
      return {
        ...occ,
        ticket: ticket
          ? {
              id: ticket.id,
              statut: ticket.statut,
              slots: (slotsByTicket.get(ticket.id) ?? []).map((s) => ({
                id: s.id,
                providerRole: s.providerRole,
                statut: s.statut,
                sentAt: s.sentAt,
                respondedAt: s.respondedAt,
                provider: s.providerId
                  ? { id: s.providerId, nom: s.providerNom!, ville: s.providerVille }
                  : null,
              })),
            }
          : null,
      };
    }),
  };
}

export type SessionGroupDetail = NonNullable<Awaited<ReturnType<typeof getSessionGroupDetail>>>;

export async function getWorkshopWithType(workshopId: string) {
  const [row] = await db
    .select({
      id: schema.workshop.id,
      nom: schema.workshop.nom,
      seancesCount: schema.workshop.seancesCount,
      durationMin: schema.workshop.durationMin,
      typeId: schema.workshop.typeId,
      typeNom: schema.workshopType.nom,
      projectCentreId: schema.project.centreId,
    })
    .from(schema.workshop)
    .innerJoin(schema.project, eq(schema.workshop.projectId, schema.project.id))
    .leftJoin(schema.workshopType, eq(schema.workshop.typeId, schema.workshopType.id))
    .where(eq(schema.workshop.id, workshopId));

  return row ?? null;
}
