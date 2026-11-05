import "server-only";

import { deliverEmail } from "@/server/lib/email";

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

export async function sendCancellationEmail(
  params: SendCancellationEmailParams
): Promise<SendCancellationEmailResult> {
  const { subject, text } = buildCancellationEmail(params);
  return deliverEmail({ type: "cancellation", to: params.to, subject, text });
}

/** Subject + text of the cancellation email. Single source for the real send and the preview. */
export function buildCancellationEmail({
  providerName,
  sessionNom,
  occurrenceDate,
}: Omit<SendCancellationEmailParams, "to">): { subject: string; text: string } {
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

  return {
    subject: `Atelier Passerelle CAP — Demande annulée — ${sessionNom}`,
    text: body,
  };
}
