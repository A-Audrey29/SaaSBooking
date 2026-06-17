/**
 * Session schema - session groups (workshop instances).
 */

import { pgTable, uuid, timestamp, text, index, integer } from "drizzle-orm/pg-core";
import { workshop } from "./workshop";
import { centre } from "./centre";
import { user } from "./auth";

/**
 * Session group - instance of a workshop for a specific group.
 */
export const sessionGroup = pgTable(
  "session_group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshop.id, { onDelete: "restrict" }),
    centreId: uuid("centre_id")
      .notNull()
      .references(() => centre.id, { onDelete: "restrict" }),
    nom: text("nom").notNull(), // e.g. "Groupe 1", "Groupe adolescents"
    audience: text("audience"), // e.g. "8 ados 13-16 ans"
    notes: text("notes"),
    sessionNumber: integer("session_number"),
    seanceNumber: integer("seance_number"),
    createdBy: uuid("created_by")
      .references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    workshopIdx: index("session_group_workshop_idx").on(table.workshopId),
    centreIdx: index("session_group_centre_idx").on(table.centreId),
  })
);
