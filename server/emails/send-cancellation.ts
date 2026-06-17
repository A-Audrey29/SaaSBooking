import "server-only";

import { Resend } from "resend";

interface SendCancellationEmailParams {
  to: string;
  providerName: string;
  sessionNom: string;
  occurrenceDate: Date | null;
}

interface SendCancellationEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendCancellationEmail({
  to,
  providerName,
  sessionNom,
  occurrenceDate,
}: SendCancellationEmailParams): Promise<SendCancellationEmailResult> {
  const dateStr = occurrenceDate
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Guadeloupe",
      }).format(occurrenceDate)
    : "date à confirmer";

  const body = `Bonjour ${providerName},

La demande vous concernant pour la session "${sessionNom}" prévue le ${dateStr} a été annulée par le référent du centre social.

Si vous avez des questions, contactez directement le centre social concerné.

---

L'équipe Cap pour FEVES`;

  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log("[send-cancellation] Email non envoyé (dev/missing key)", { to, sessionNom });
    return { sent: false };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@resapresta.feves971.fr",
      to,
      subject: `Atelier Passerelle CAPDemande annulée — ${sessionNom}`,
      text: body,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[send-cancellation] Échec envoi Resend", { to, error: message });
    return { sent: false, error: message };
  }
}
