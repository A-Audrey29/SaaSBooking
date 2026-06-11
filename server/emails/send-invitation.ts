import "server-only";

import { Resend } from "resend";

interface SendInvitationEmailParams {
  to: string;
  name: string | null;
  inviterName: string;
  token: string;
}

interface SendInvitationEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendInvitationEmail({
  to,
  name,
  inviterName,
  token,
}: SendInvitationEmailParams): Promise<SendInvitationEmailResult> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const setupUrl = `${appUrl}/setup-password?token=${token}`;
  const displayName = name ?? to;

  const body = `Bonjour ${displayName},

${inviterName} vous a créé un compte sur Asanblé, la plateforme
de coordination des ateliers du projet Passerelle CAP.

Pour activer votre compte, choisissez votre mot de passe :
${setupUrl}

Ce lien est valable 7 jours. Passé ce délai, demandez à
${inviterName} de vous renvoyer une invitation.

Votre identifiant de connexion : ${to}

---
Asanblé`;

  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log("[send-invitation] Email non envoyé (dev/missing key)", {
      to,
      setupUrl,
    });
    return { sent: false };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@resapresta.feves971.fr",
      to,
      subject: "Votre accès à Asanblé — Configurez votre mot de passe",
      text: body,
    });
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
