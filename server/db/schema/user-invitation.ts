import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userInvitation = pgTable("user_invitation", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
});
