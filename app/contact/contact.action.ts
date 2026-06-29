"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { requireAuth } from "@/server/context/server-context";
import { auth } from "@/server/auth/config";
import { sendContactEmail } from "@/server/emails/send-contact";

const contactSchema = z.object({
  subject: z.string().min(3, "Objet trop court (min 3 caractères)").max(200),
  message: z.string().min(10, "Message trop court (min 10 caractères)").max(5000),
});

export interface ContactState {
  success?: boolean;
  error?: string;
  fieldErrors?: { subject?: string[]; message?: string[] };
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  project_admin: "Admin Projet",
  referent: "Référent",
  provider: "Prestataire",
};

export async function sendContact(
  _prevState: ContactState | undefined,
  formData: FormData
): Promise<ContactState> {
  const ctx = await requireAuth();

  const parsed = contactSchema.safeParse({
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { subject, message } = parsed.data;

  // name and email come from session — not from formData (untrusted client input)
  const session = await auth.api.getSession({ headers: await headers() });
  const name = session?.user?.name ?? ctx.userId;
  const email = session?.user?.email ?? "";
  const roleLabel = ROLE_LABELS[ctx.role] ?? ctx.role;

  const result = await sendContactEmail({
    from: { name, email, role: roleLabel },
    subject,
    message,
  });

  if (!result.sent && result.error) {
    return {
      error:
        "Échec de l'envoi. Réessayez ou contactez pole-it@fevesguadeloupeetsaintmartin.fr directement.",
    };
  }

  return { success: true };
}
