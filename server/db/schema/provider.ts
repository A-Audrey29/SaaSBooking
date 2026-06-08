/**
 * Provider schema - external service providers.
 */

import { pgTable, uuid, timestamp, text, index, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { project } from "./project";
import { metier } from "./metier";
import { user } from "./auth";

/**
 * Provider - external service provider.
 */
export const provider = pgTable(
  "provider",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").unique().references(() => user.id, { onDelete: "set null" }), // BDR-010
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

/**
 * Provider availability - time windows when a provider is available or unavailable.
 * `kind = 'available'` : couverture positive (filtre getProvidersForSlot).
 * `kind = 'unavailable'` : exception ponctuelle déclarée par le prestataire — bloque
 * une plage sans être comptée comme couverture.
 * Overlaps not constrained in V1 (BDR-008).
 */
export const providerAvailability = pgTable(
  "provider_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => provider.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    kind: text("kind").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => ({
    providerIdx: index("provider_availability_provider_idx").on(table.providerId),
    startAtIdx: index("provider_availability_start_at_idx").on(table.startAt),
    kindCheck: check("provider_availability_kind_check", sql`${table.kind} IN ('available', 'unavailable')`),
  })
);
