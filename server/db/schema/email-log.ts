/**
 * Email log schema - one row per transactional email attempt.
 *
 * Purpose: let super_admin see which emails were sent / failed / skipped
 * without opening the Resend dashboard.
 *
 * Privacy: we store recipient + subject only, never the email body
 * (bodies contain setup / reset links that must not be readable after the fact).
 *
 * Like audit_log, this is a technical log, not a business table:
 * no soft delete, rows are append-only.
 */

import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";

/** Kinds of transactional emails the app sends (one per server/emails/send-*.ts). */
export const EMAIL_LOG_TYPES = [
  "invitation",
  "assignment",
  "cancellation",
  "password_reset",
  "contact",
] as const;

/**
 * - sent: Resend accepted the email
 * - failed: Resend threw an error (see `error`)
 * - skipped: not sent on purpose (dev environment or RESEND_API_KEY missing)
 */
export const EMAIL_LOG_STATUSES = ["sent", "failed", "skipped"] as const;

export type EmailLogType = (typeof EMAIL_LOG_TYPES)[number];
export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number];

export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Type-level enums only (no DB CHECK): values are written by our own code exclusively.
    type: text("type", { enum: EMAIL_LOG_TYPES }).notNull(),
    status: text("status", { enum: EMAIL_LOG_STATUSES }).notNull(),
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull(),
    error: text("error"), // Resend error message when status = failed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("email_log_created_at_idx").on(table.createdAt),
    recipientIdx: index("email_log_recipient_idx").on(table.recipient),
  })
);
