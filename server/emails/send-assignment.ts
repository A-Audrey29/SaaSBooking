import "server-only";

import { Resend } from "resend";

interface SendAssignmentEmailParams {
  to: string;
  providerName: string;
  sessionNom: string;
  centreName: string;
  occurrenceDate: Date | null;
}

interface SendAssignmentEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendAssignmentEmail({
  to,
  providerName,
  sessionNom,
  centreName,
  occurrenceDate,
}: SendAssignmentEmailParams): Promise<SendAssignmentEmailResult> {
  const dateStr = occurrenceDate
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Guadeloupe",
      }).format(occurrenceDate)
    : "date à confirmer";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://resapresta.feves971.fr";

  const body = `Bonjour ${providerName},

Le centre social ${centreName} vous a envoyé une demande pour la session "${sessionNom}" prévue le ${dateStr}.

Veuillez vous connecter à l'application pour confirmer ou refuser cette demande :
${appUrl}/pro/missions

---

L'équipe Cap pour FEVES`;

  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log("[send-assignment] Email non envoyé (dev/missing key)", { to, sessionNom });
    return { sent: false };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@resapresta.feves971.fr",
      to,
      subject: `Atelier Passerelle CAP — Nouvelle demande — ${sessionNom}`,
      text: body,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[send-assignment] Échec envoi Resend", { to, error: message });
    return { sent: false, error: message };
  }
}
