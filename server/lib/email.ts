import "server-only";

/**
 * Single delivery point for every transactional email (Resend).
 *
 * Each server/emails/send-*.ts builds its own text, then calls deliverEmail().
 * This function:
 *   1. skips sending outside production (or without RESEND_API_KEY)
 *   2. sends via Resend and checks the returned `error`
 *      (Resend SDK v4 does NOT throw on API errors: it returns { data, error })
 *   3. records the attempt in `email_log` (read by /admin/journal)
 *
 * It never throws: email failures are non-blocking for the business action.
 */

import { Resend } from "resend";
import { db, schema } from "@/server/db/client";
import type { EmailLogStatus, EmailLogType } from "@/server/db/schema/email-log";

interface DeliverEmailParams {
  type: EmailLogType;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  /** Extra context printed in dev logs only (e.g. setup URL). Never stored in DB. */
  devLog?: Record<string, unknown>;
}

export interface DeliverEmailResult {
  sent: boolean;
  error?: string;
}

/**
 * Exact content of an email, shown in the confirmation dialog before sending.
 * Built by the same build*Email() function as the real send → cannot diverge.
 */
export interface EmailPreview {
  to: string;
  subject: string;
  text: string;
}

/** preview = null when no email will be sent (e.g. slot without provider). */
export type EmailPreviewResult =
  | { ok: true; preview: EmailPreview | null }
  | { ok: false; error: string };

/**
 * Replaces personal one-time links (setup / reset) in previews:
 * the real token only exists once the action runs.
 */
export const PREVIEW_LINK_PLACEHOLDER = "[lien personnel — généré au moment de l'envoi]";

export async function deliverEmail({
  type,
  to,
  subject,
  text,
  replyTo,
  devLog,
}: DeliverEmailParams): Promise<DeliverEmailResult> {
  const tag = `[email:${type}]`;

  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log(`${tag} Email non envoyé (dev/missing key)`, { to, subject, ...devLog });
    await logEmail({ type, status: "skipped", recipient: to, subject });
    return { sent: false };
  }

  let errorMessage: string | null = null;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@resapresta.fr",
      to,
      replyTo,
      subject,
      text,
    });
    if (error) errorMessage = error.message;
  } catch (e) {
    // Network failure or unexpected SDK error
    errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
  }

  if (errorMessage) {
    console.error(`${tag} Échec envoi Resend`, { to, error: errorMessage });
    await logEmail({ type, status: "failed", recipient: to, subject, error: errorMessage });
    return { sent: false, error: errorMessage };
  }

  await logEmail({ type, status: "sent", recipient: to, subject });
  return { sent: true };
}

/**
 * Insert one row in email_log. Never throws: a logging failure must not
 * break the email flow. Failures go to console.
 */
async function logEmail(row: {
  type: EmailLogType;
  status: EmailLogStatus;
  recipient: string;
  subject: string;
  error?: string;
}): Promise<void> {
  try {
    await db.insert(schema.emailLog).values({ ...row, error: row.error ?? null });
  } catch (e) {
    console.error("[email-log] Échec écriture email_log", {
      type: row.type,
      recipient: row.recipient,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
