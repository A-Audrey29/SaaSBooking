/**
 * Provider schema - external service providers.
 */

import { pgTable, uuid, timestamp, text, index, unique } from "drizzle-orm/pg-core";
import { project } from "./project";
import { metier } from "./metier";

/**
 * Provider - external service provider.
 */
export const provider = pgTable(
  "provider",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("nom").notNull(),
    email: text("email").notNull(),
    telephone: text("telephone"),
    ville: text("ville"),
    metierId: uuid("metier_id").references(() => metier.id, { onDelete: "restrict" }),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    emailIdx: index("provider_email_idx").on(table.email),
  })
);

/**
 * Provider assignment - junction table with soft delete.
 */
export const providerAssignment = pgTable(
  "provider_assignment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => provider.id, { onDelete: "restrict" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "restrict" }),
    metierId: uuid("metier_id")
      .notNull()
      .references(() => metier.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    providerIdx: index("provider_assignment_provider_idx").on(table.providerId),
    projectIdx: index("provider_assignment_project_idx").on(table.projectId),
    uniquePerProject: unique("provider_assignment_unique_per_project")
      .on(table.providerId, table.projectId, table.metierId),
  })
);
