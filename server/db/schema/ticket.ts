/**
 * Ticket schema - requests for provider assignments.
 */

import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";
import { occurrence } from "./occurrence";
import { provider } from "./provider";

/**
 * Ticket - request for provider(s) for an occurrence.
 */
export const ticket = pgTable(
  "ticket",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    occurrenceId: uuid("occurrence_id")
      .notNull()
      .references(() => occurrence.id, { onDelete: "cascade" }),
    statut: text("statut").notNull().default("empty"), // empty | pending | confirmed | refused | cancelled | done | skipped
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    occurrenceIdx: index("ticket_occurrence_idx").on(table.occurrenceId),
    statutIdx: index("ticket_statut_idx").on(table.statut),
  })
);

/**
 * Ticket slot - individual role slot within a ticket.
 */
export const ticketSlot = pgTable(
  "ticket_slot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    providerRole: text("provider_role").notNull(), // role code
    providerId: uuid("provider_id").references(() => provider.id, { onDelete: "set null" }),
    statut: text("statut").notNull().default("empty"), // empty | pending | confirmed | refused | cancelled | done | skipped
    sentAt: timestamp("sent_at", { mode: "date", withTimezone: true }), // when request was sent
    respondedAt: timestamp("responded_at", { mode: "date", withTimezone: true }), // when provider responded
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    ticketIdx: index("ticket_slot_ticket_idx").on(table.ticketId),
    providerIdx: index("ticket_slot_provider_idx").on(table.providerId),
    statutIdx: index("ticket_slot_statut_idx").on(table.statut),
  })
);
