import "server-only";

import { deliverEmail } from "@/server/lib/email";

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

  return deliverEmail({
    type: "contact",
    to: "pole-it@fevesguadeloupeetsaintmartin.fr",
    replyTo: from.email,
    subject: `[ResaPresta] ${subject}`,
    text: body,
    devLog: { from },
  });
}
