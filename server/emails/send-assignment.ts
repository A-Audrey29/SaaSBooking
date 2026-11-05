import "server-only";

import { deliverEmail } from "@/server/lib/email";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://resapresta.fr";

  const body = `Bonjour ${providerName},

Le centre social ${centreName} vous a envoyé une demande pour la session "${sessionNom}" prévue le ${dateStr}.

Veuillez vous connecter à l'application pour confirmer ou refuser cette demande :
${appUrl}/pro/missions

---

L'équipe Cap pour FEVES`;

  return deliverEmail({
    type: "assignment",
    to,
    subject: `Atelier Passerelle CAP — Nouvelle demande — ${sessionNom}`,
    text: body,
  });
}
