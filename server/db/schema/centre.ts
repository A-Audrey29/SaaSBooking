/**
 * Centre schema - tenant root entity.
 */

import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";

export const centre = pgTable(
  "centre",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("nom").notNull(),
    adresse: text("adresse"),
    ville: text("ville").notNull(),
    timezone: text("timezone").notNull().default("America/Guadeloupe"),
    telephone: text("telephone"),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    villeIdx: index("centre_ville_idx").on(table.ville),
  })
);
