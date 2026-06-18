import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { project } from "./project";
import { centre } from "./centre";

export const projectCentre = pgTable(
  "project_centre",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    centreId: uuid("centre_id")
      .notNull()
      .references(() => centre.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.centreId] }),
  })
);

export const projectCentreRelations = relations(projectCentre, ({ one }) => ({
  project: one(project, {
    fields: [projectCentre.projectId],
    references: [project.id],
  }),
  centre: one(centre, {
    fields: [projectCentre.centreId],
    references: [centre.id],
  }),
}));
