/**
 * Audit schema - audit log for all mutations.
 */

import { pgTable, uuid, timestamp, text, index, jsonb } from "drizzle-orm/pg-core";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centreId: uuid("centre_id"), // nullable: null for super_admin actions without centre scope
    userId: uuid("user_id").notNull(), // who made the change
    action: text("action").notNull(), // create | update | delete
    entityType: text("entity_type").notNull(), // table name
    entityId: uuid("entity_id").notNull(),
    before: jsonb("before"), // old state
    after: jsonb("after"), // new state
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    centreIdx: index("audit_log_centre_idx").on(table.centreId),
    userIdIdx: index("audit_log_user_idx").on(table.userId),
    entityIdx: index("audit_log_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  })
);
