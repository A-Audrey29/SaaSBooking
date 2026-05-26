/**
 * Provider schema - external service providers.
 */

import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";
import { centre } from "./centre";
import { project } from "./project";

/**
 * Provider - external service provider, assigned to a centre.
 */
export const provider = pgTable(
  "provider",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centreId: uuid("centre_id")
      .notNull()
      .references(() => centre.id, { onDelete: "restrict" }),
    nom: text("nom").notNull(),
    email: text("email").notNull(),
    telephone: text("telephone"),
    ville: text("ville"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    centreIdx: index("provider_centre_idx").on(table.centreId),
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
    role: text("role").notNull(), // role code
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    providerIdx: index("provider_assignment_provider_idx").on(table.providerId),
    projectIdx: index("provider_assignment_project_idx").on(table.projectId),
  })
);
