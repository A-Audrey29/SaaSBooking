import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workshopRoleSlot } from "./workshop";
import { provider, providerAssignment } from "./provider";

export const metier = pgTable(
  "metier",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("nom").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    nomIdx: index("metier_nom_idx").on(table.nom),
  })
);

export const metierRelations = relations(metier, ({ many }) => ({
  workshopRoleSlots: many(workshopRoleSlot),
  providers: many(provider),
  providerAssignments: many(providerAssignment),
}));
