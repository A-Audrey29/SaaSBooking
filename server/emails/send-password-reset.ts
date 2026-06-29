import "server-only";

import { Resend } from "resend";

interface SendPasswordResetEmailParams {
  to: string;
  name: string | null;
  token: string;
}

interface SendPasswordResetEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: SendPasswordResetEmailParams): Promise<SendPasswordResetEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  const displayName = name ?? to;

  const body = `Bonjour ${displayName},

Vous avez demandé la réinitialisation de votre mot de passe ResaPresta.

Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :
${resetUrl}

Ce lien est valable 1 heure. Passé ce délai, vous devrez faire une nouvelle demande.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre compte reste intact.

Votre identifiant de connexion : ${to}

---
L'équipe Cap pour FEVES`;

  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log("[send-password-reset] Email non envoyé (dev/missing key)", {
      to,
      resetUrl,
    });
    return { sent: false };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@resapresta.fr",
      to,
      subject: "Réinitialisation de votre mot de passe ResaPresta",
      text: body,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[send-password-reset] Échec envoi Resend", { to, error: message });
    return { sent: false, error: message };
  }
}
