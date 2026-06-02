/**
 * Occurrence schema - dated occurrences of session groups.
 */

import { pgTable, uuid, timestamp, text, integer, index } from "drizzle-orm/pg-core";
import { sessionGroup } from "./session";

export const occurrence = pgTable(
  "occurrence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionGroupId: uuid("session_group_id")
      .notNull()
      .references(() => sessionGroup.id, { onDelete: "cascade" }),
    index: integer("index").notNull(), // 1, 2, 3... within session group
    startAt: timestamp("start_at", { mode: "date", withTimezone: true }).notNull(), // UTC
    endAt: timestamp("end_at", { mode: "date", withTimezone: true }).notNull(), // UTC
    lieu: text("lieu"),
    salle: text("salle"),
    notes: text("notes"),
    statut: text("statut").notNull().default("planned"), // CHECK constraint DB: planned | confirmed | completed | cancelled
    workshopRoleGroupId: uuid("workshop_role_group_id"), // FK added in migration 0004 after table creation
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    sessionGroupIdx: index("occurrence_session_group_idx").on(table.sessionGroupId),
    startAtIdx: index("occurrence_start_at_idx").on(table.startAt),
    statutIdx: index("occurrence_statut_idx").on(table.statut),
  })
);
