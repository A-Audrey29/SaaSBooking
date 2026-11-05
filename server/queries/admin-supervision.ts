import "server-only";

/**
 * Read-only queries for super_admin supervision screens:
 *   /admin           → dashboard counters + alert lists
 *   /admin/reservations → all bookings (ticket slots with a provider)
 *   /admin/journal   → activity log (audit_log) + email log (email_log)
 *   /admin/users     → users with last login + invitation status
 *
 * No centre scope here: callers MUST guard with requireRole("super_admin")
 * (super_admin bypasses centre_id by design, see spec §2).
 */

import { and, desc, eq, gte, isNotNull, isNull, lt, max, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema } from "@/server/db/client";
import type { EmailLogStatus } from "@/server/db/schema/email-log";

/** A pending request with no provider answer after this many days is flagged. */
export const STALE_PENDING_DAYS = 5;

/** Max rows returned by list screens (no pagination in V1). */
export const ADMIN_LIST_LIMIT = 200;
export const BOOKINGS_LIST_LIMIT = 500;

/** Ticket slot statuses meaningful for a booking (slot with a provider). */
export const BOOKING_STATUTS = ["pending", "confirmed", "refused", "cancelled", "done"] as const;
export type BookingStatut = (typeof BOOKING_STATUTS)[number];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// ── Bookings ─────────────────────────────────────────────────────────────────

export interface BookingRow {
  slotId: string;
  statut: string;
  providerRole: string;
  sentAt: Date | null;
  respondedAt: Date | null;
  occurrenceStartAt: Date | null;
  occurrenceIndex: number;
  sessionGroupId: string;
  sessionNom: string;
  workshopNom: string;
  centreId: string;
  centreNom: string;
  providerNom: string | null;
  providerEmail: string | null;
  referentName: string | null;
  referentEmail: string | null;
}

interface ListBookingsFilters {
  statut?: BookingStatut;
  centreId?: string;
  /** Only pending requests sent more than STALE_PENDING_DAYS ago. */
  staleOnly?: boolean;
}

/**
 * Ticket slots that have a provider (= a request was made to someone).
 * Empty / skipped slots without provider are not bookings and are excluded.
 */
export async function listBookings(filters: ListBookingsFilters = {}): Promise<BookingRow[]> {
  const referent = alias(schema.user, "referent");

  const conditions = [
    isNotNull(schema.ticketSlot.providerId),
    isNull(schema.ticketSlot.deletedAt),
    isNull(schema.ticket.deletedAt),
    isNull(schema.occurrence.deletedAt),
    isNull(schema.sessionGroup.deletedAt),
  ];
  if (filters.statut) conditions.push(eq(schema.ticketSlot.statut, filters.statut));
  if (filters.centreId) conditions.push(eq(schema.sessionGroup.centreId, filters.centreId));
  if (filters.staleOnly) {
    conditions.push(eq(schema.ticketSlot.statut, "pending"));
    // sent_at may be NULL on old rows → fall back on updated_at
    conditions.push(
      lt(
        sql`COALESCE(${schema.ticketSlot.sentAt}, ${schema.ticketSlot.updatedAt})`,
        daysAgo(STALE_PENDING_DAYS)
      )
    );
  }

  return db
    .select({
      slotId: schema.ticketSlot.id,
      statut: schema.ticketSlot.statut,
      providerRole: schema.ticketSlot.providerRole,
      sentAt: schema.ticketSlot.sentAt,
      respondedAt: schema.ticketSlot.respondedAt,
      occurrenceStartAt: schema.occurrence.startAt,
      occurrenceIndex: schema.occurrence.index,
      sessionGroupId: schema.sessionGroup.id,
      sessionNom: schema.sessionGroup.nom,
      workshopNom: schema.workshop.nom,
      centreId: schema.centre.id,
      centreNom: schema.centre.nom,
      providerNom: schema.provider.nom,
      providerEmail: schema.provider.email,
      referentName: referent.name,
      referentEmail: referent.email,
    })
    .from(schema.ticketSlot)
    .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
    .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
    .innerJoin(schema.sessionGroup, eq(schema.occurrence.sessionGroupId, schema.sessionGroup.id))
    .innerJoin(schema.workshop, eq(schema.sessionGroup.workshopId, schema.workshop.id))
    .innerJoin(schema.centre, eq(schema.sessionGroup.centreId, schema.centre.id))
    .leftJoin(schema.provider, eq(schema.ticketSlot.providerId, schema.provider.id))
    .leftJoin(referent, eq(schema.sessionGroup.createdBy, referent.id))
    .where(and(...conditions))
    .orderBy(sql`${schema.occurrence.startAt} DESC NULLS LAST`)
    .limit(BOOKINGS_LIST_LIMIT);
}

// ── Providers needing attention ──────────────────────────────────────────────

export interface IncompleteProviderRow {
  key: string;
  nom: string;
  email: string;
  reason: "no_profile" | "no_future_availability";
}

/**
 * - no_profile: user with role=provider but no `provider` row
 *   (they land on /pro/profile "Créer mon profil" at next login)
 * - no_future_availability: provider with no `available` slot ending in the future
 *   (referents cannot book them)
 */
export async function listIncompleteProviders(): Promise<IncompleteProviderRow[]> {
  const [noProfile, noAvailability] = await Promise.all([
    db
      .select({ id: schema.user.id, nom: schema.user.name, email: schema.user.email })
      .from(schema.user)
      .leftJoin(
        schema.provider,
        and(eq(schema.provider.userId, schema.user.id), isNull(schema.provider.deletedAt))
      )
      .where(
        and(
          eq(schema.user.role, "provider"),
          isNull(schema.user.deletedAt),
          isNull(schema.provider.id)
        )
      ),
    db
      .select({ id: schema.provider.id, nom: schema.provider.nom, email: schema.provider.email })
      .from(schema.provider)
      .where(
        and(
          isNull(schema.provider.deletedAt),
          sql`NOT EXISTS (
            SELECT 1 FROM ${schema.providerAvailability} pa
            WHERE pa.provider_id = ${schema.provider.id}
              AND pa.kind = 'available'
              AND pa.deleted_at IS NULL
              AND pa.end_at > now()
          )`
        )
      ),
  ]);

  return [
    ...noProfile.map((u) => ({
      key: `user-${u.id}`,
      nom: u.nom ?? u.email,
      email: u.email,
      reason: "no_profile" as const,
    })),
    ...noAvailability.map((p) => ({
      key: `provider-${p.id}`,
      nom: p.nom,
      email: p.email,
      reason: "no_future_availability" as const,
    })),
  ];
}

// ── Users ────────────────────────────────────────────────────────────────────

export type InvitationStatus = "active" | "invitation_pending" | "invitation_expired" | "no_invitation";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  centreId: string | null;
  centreNom: string | null;
  passwordSet: boolean | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  invitationStatus: InvitationStatus;
}

/** Active users + last login + status of their latest unused invitation. */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  // Latest expiry among unused invitations, per user
  const latestInvitation = db
    .select({
      userId: schema.userInvitation.userId,
      expiresAt: max(schema.userInvitation.expiresAt).as("latest_expires_at"),
    })
    .from(schema.userInvitation)
    .where(isNull(schema.userInvitation.usedAt))
    .groupBy(schema.userInvitation.userId)
    .as("latest_invitation");

  const rows = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      name: schema.user.name,
      role: schema.user.role,
      centreId: schema.user.centreId,
      centreNom: schema.centre.nom,
      passwordSet: schema.user.passwordSet,
      createdAt: schema.user.createdAt,
      lastLoginAt: schema.user.lastLoginAt,
      invitationExpiresAt: latestInvitation.expiresAt,
    })
    .from(schema.user)
    .leftJoin(schema.centre, eq(schema.user.centreId, schema.centre.id))
    .leftJoin(latestInvitation, eq(latestInvitation.userId, schema.user.id))
    .where(isNull(schema.user.deletedAt));

  const now = Date.now();
  return rows.map(({ invitationExpiresAt, ...u }) => {
    let invitationStatus: InvitationStatus;
    // Already logged in = working account, even if passwordSet is false
    // (seeded accounts are created without going through the invitation flow).
    if (u.passwordSet || u.lastLoginAt) invitationStatus = "active";
    else if (!invitationExpiresAt) invitationStatus = "no_invitation";
    else if (new Date(invitationExpiresAt).getTime() < now) invitationStatus = "invitation_expired";
    else invitationStatus = "invitation_pending";
    return { ...u, invitationStatus };
  });
}

// ── Journal: activity (audit_log) ────────────────────────────────────────────

export interface AuditRow {
  id: string;
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string | null;
  actorEmail: string | null;
  /** Human-readable summary of changed fields, e.g. "statut: pending → confirmed". */
  changes: string;
}

export async function listAuditLog(entityType?: string): Promise<AuditRow[]> {
  const rows = await db
    .select({
      id: schema.auditLog.id,
      createdAt: schema.auditLog.createdAt,
      action: schema.auditLog.action,
      entityType: schema.auditLog.entityType,
      entityId: schema.auditLog.entityId,
      before: schema.auditLog.before,
      after: schema.auditLog.after,
      actorName: schema.user.name,
      actorEmail: schema.user.email,
    })
    .from(schema.auditLog)
    .leftJoin(schema.user, eq(schema.auditLog.userId, schema.user.id))
    .where(entityType ? eq(schema.auditLog.entityType, entityType) : undefined)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(ADMIN_LIST_LIMIT);

  return rows.map(({ before, after, ...r }) => ({
    ...r,
    changes: summarizeChanges(before, after),
  }));
}

/** Distinct entity types present in audit_log (for the filter dropdown). */
export async function listAuditEntityTypes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ entityType: schema.auditLog.entityType })
    .from(schema.auditLog)
    .orderBy(schema.auditLog.entityType);
  return rows.map((r) => r.entityType);
}

/** Fields never shown in the journal (technical noise or sensitive). */
const HIDDEN_AUDIT_KEYS = new Set(["id", "createdAt", "updatedAt", "password", "token"]);
const MAX_VALUE_LENGTH = 40;
const MAX_CHANGES_SHOWN = 4;

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > MAX_VALUE_LENGTH ? `${s.slice(0, MAX_VALUE_LENGTH)}…` : s;
}

/** Compare before/after JSON snapshots and list changed fields. */
function summarizeChanges(before: unknown, after: unknown): string {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter(
    (k) => !HIDDEN_AUDIT_KEYS.has(k) && JSON.stringify(b[k]) !== JSON.stringify(a[k])
  );
  if (keys.length === 0) return "";

  const parts = keys.slice(0, MAX_CHANGES_SHOWN).map((k) =>
    before == null
      ? `${k}: ${formatValue(a[k])}`
      : `${k}: ${formatValue(b[k])} → ${formatValue(a[k])}`
  );
  const rest = keys.length - MAX_CHANGES_SHOWN;
  return rest > 0 ? `${parts.join(" · ")} · +${rest}` : parts.join(" · ");
}

// ── Journal: emails ──────────────────────────────────────────────────────────

export async function listEmailLog(status?: EmailLogStatus) {
  return db
    .select()
    .from(schema.emailLog)
    .where(status ? eq(schema.emailLog.status, status) : undefined)
    .orderBy(desc(schema.emailLog.createdAt))
    .limit(ADMIN_LIST_LIMIT);
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  pendingTotal: number;
  confirmedUpcoming: number;
  refusedLast30Days: number;
  emailsFailedLast7Days: number;
  usersNeverLoggedIn: number;
  invitationsExpired: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const activeSlot = and(
    isNotNull(schema.ticketSlot.providerId),
    isNull(schema.ticketSlot.deletedAt)
  );

  const [slotCounts, upcoming, emailsFailed, users] = await Promise.all([
    db
      .select({
        pending: sql<number>`COUNT(*) FILTER (WHERE ${schema.ticketSlot.statut} = 'pending')`.mapWith(Number),
        refused30: sql<number>`COUNT(*) FILTER (
          WHERE ${schema.ticketSlot.statut} = 'refused'
            AND COALESCE(${schema.ticketSlot.respondedAt}, ${schema.ticketSlot.updatedAt}) >= ${daysAgo(30)}
        )`.mapWith(Number),
      })
      .from(schema.ticketSlot)
      .where(activeSlot),
    db
      .select({ n: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(schema.ticketSlot)
      .innerJoin(schema.ticket, eq(schema.ticketSlot.ticketId, schema.ticket.id))
      .innerJoin(schema.occurrence, eq(schema.ticket.occurrenceId, schema.occurrence.id))
      .where(
        and(
          activeSlot,
          eq(schema.ticketSlot.statut, "confirmed"),
          isNull(schema.occurrence.deletedAt),
          gte(schema.occurrence.startAt, new Date())
        )
      ),
    db
      .select({ n: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(schema.emailLog)
      .where(
        and(eq(schema.emailLog.status, "failed"), gte(schema.emailLog.createdAt, daysAgo(7)))
      ),
    listUsersForAdmin(),
  ]);

  return {
    pendingTotal: slotCounts[0]?.pending ?? 0,
    confirmedUpcoming: upcoming[0]?.n ?? 0,
    refusedLast30Days: slotCounts[0]?.refused30 ?? 0,
    emailsFailedLast7Days: emailsFailed[0]?.n ?? 0,
    usersNeverLoggedIn: users.filter((u) => u.lastLoginAt === null).length,
    invitationsExpired: users.filter((u) => u.invitationStatus === "invitation_expired").length,
  };
}

// ── Centres (filter dropdown) ────────────────────────────────────────────────

export async function listActiveCentres() {
  return db
    .select({ id: schema.centre.id, nom: schema.centre.nom })
    .from(schema.centre)
    .where(isNull(schema.centre.deletedAt))
    .orderBy(schema.centre.nom);
}

