/**
 * Workshop schema - workshops and workshop types.
 */

import { pgTable, uuid, timestamp, text, integer, index, unique, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { centre } from "./centre";
import { project } from "./project";
import { metier } from "./metier";

/**
 * Workshop types - reference enum (11 fixed types).
 */
export const workshopType = pgTable(
  "workshop_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centreId: uuid("centre_id").references(() => centre.id, { onDelete: "set null" }),
    code: text("code").notNull().unique(), // e.g. "PARENTALITE", "SPORT_SANTE"
    nom: text("nom").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    codeIdx: index("workshop_type_code_idx").on(table.code),
    centreIdx: index("workshop_type_centre_idx").on(table.centreId),
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
 * Workshop role group - required role groups for workshop types.
 * Allows OR logic between groups (referent chooses one group per occurrence).
 */
export const workshopRoleGroup = pgTable(
  "workshop_role_group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopTypeId: uuid("workshop_type_id")
      .notNull()
      .references(() => workshopType.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // e.g. "Configuration standard"
    ordre: integer("ordre").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    workshopTypeIdx: index("workshop_role_group_workshop_type_idx").on(table.workshopTypeId),
  })
);

/**
 * Workshop role slot - individual role within a role group.
 * 1 slot = 1 person. If admin wants 2 animators, create 2 slots.
 */
export const workshopRoleSlot = pgTable(
  "workshop_role_slot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopRoleGroupId: uuid("workshop_role_group_id")
      .notNull()
      .references(() => workshopRoleGroup.id, { onDelete: "cascade" }),
    metierId: uuid("metier_id")
      .notNull()
      .references(() => metier.id, { onDelete: "restrict" }),
    couleur: text("couleur"), // hex color, nullable
    isOptional: boolean("is_optional").notNull().default(false), // pre-unchecked in UI
    ordre: integer("ordre").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    workshopRoleGroupIdx: index("workshop_role_slot_workshop_role_group_idx").on(table.workshopRoleGroupId),
  })
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const workshopTypeRelations = relations(workshopType, ({ one, many }) => ({
  centre: one(centre, {
    fields: [workshopType.centreId],
    references: [centre.id],
  }),
  workshopRoleGroups: many(workshopRoleGroup),
}));

export const workshopRoleGroupRelations = relations(workshopRoleGroup, ({ one, many }) => ({
  workshopType: one(workshopType, {
    fields: [workshopRoleGroup.workshopTypeId],
    references: [workshopType.id],
  }),
  workshopRoleSlots: many(workshopRoleSlot),
}));

export const workshopRoleSlotRelations = relations(workshopRoleSlot, ({ one }) => ({
  workshopRoleGroup: one(workshopRoleGroup, {
    fields: [workshopRoleSlot.workshopRoleGroupId],
    references: [workshopRoleGroup.id],
  }),
  metier: one(metier, {
    fields: [workshopRoleSlot.metierId],
    references: [metier.id],
  }),
}));
