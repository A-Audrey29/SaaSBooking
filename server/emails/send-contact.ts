import "server-only";

import { Resend } from "resend";

interface SendContactEmailParams {
  from: { name: string; email: string; role: string };
  subject: string;
  message: string;
}

interface SendContactEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendContactEmail({
  from,
  subject,
  message,
}: SendContactEmailParams): Promise<SendContactEmailResult> {
  const body = `Nouveau message depuis ResaPresta

De : ${from.name} (${from.email})
Rôle : ${from.role}
Objet : ${subject}

---
${message}
---

Message envoyé via le formulaire de contact ResaPresta.`;

  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production") {
    console.log("[send-contact] Email non envoyé (dev/missing key)", {
      from,
      subject,
    });
    return { sent: false };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@resapresta.fr",
      to: "pole-it@fevesguadeloupeetsaintmartin.fr",
      replyTo: from.email,
      subject: `[ResaPresta] ${subject}`,
      text: body,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[send-contact] Échec envoi Resend", { from, error: message });
    return { sent: false, error: message };
  }
}
