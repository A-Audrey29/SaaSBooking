/**
 * Project schema - scoped to a single centre.
 */

import { pgTable, uuid, timestamp, text, date, index } from "drizzle-orm/pg-core";
import { centre } from "./centre";

export const project = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centreId: uuid("centre_id")
      .notNull()
      .references(() => centre.id, { onDelete: "restrict" }),
    nom: text("nom").notNull(),
    description: text("description"),
    financeur: text("financeur"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    centreIdx: index("project_centre_idx").on(table.centreId),
  })
);
