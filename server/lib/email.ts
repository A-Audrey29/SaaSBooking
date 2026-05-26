/**
 * Email wrapper using Resend.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via Resend.
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@localhost",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Send magic link email (handled by Better Auth, but kept for future use).
 */
export async function sendMagicLink(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Lien de connexion",
    html: `
      <h1>Lien de connexion</h1>
      <p>Cliquez sur le lien ci-dessous pour vous connecter :</p>
      <a href="${url}">${url}</a>
      <p>Ce lien expire dans 15 minutes.</p>
    `,
    text: `Cliquez sur ce lien pour vous connecter : ${url}`,
  });
}
