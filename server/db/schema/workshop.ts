/**
 * Workshop schema - workshops and workshop types.
 */

import { pgTable, uuid, timestamp, text, integer, index } from "drizzle-orm/pg-core";
import { project } from "./project";

/**
 * Workshop types - reference enum (11 fixed types).
 */
export const workshopType = pgTable(
  "workshop_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(), // e.g. "PARENTALITE", "SPORT_SANTE"
    nom: text("nom").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("workshop_type_code_idx").on(table.code),
  })
);

/**
 * Workshop - scoped to project.
 */
export const workshop = pgTable(
  "workshop",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "restrict" }),
    typeId: uuid("type_id").references(() => workshopType.id, { onDelete: "restrict" }),
    nom: text("nom").notNull(),
    description: text("description"),
    seancesCount: integer("seances_count").notNull().default(1),
    durationMin: integer("duration_min").notNull().default(90),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    projectIdx: index("workshop_project_idx").on(table.projectId),
    typeIdx: index("workshop_type_idx").on(table.typeId),
  })
);

/**
 * Provider role - required roles for workshop types.
 */
export const providerRole = pgTable(
  "provider_role",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopTypeId: uuid("workshop_type_id")
      .notNull()
      .references(() => workshopType.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // e.g. "Psychologue", "Coach sportif"
    couleur: text("couleur").notNull().default("#888888"), // hex color
    ordre: integer("ordre").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workshopTypeIdx: index("provider_role_workshop_type_idx").on(table.workshopTypeId),
  })
);
