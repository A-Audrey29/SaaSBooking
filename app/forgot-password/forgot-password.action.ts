"use server";

import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { RequestPasswordResetSchema } from "@/server/validations/user";
import { sendPasswordResetEmail } from "@/server/emails/send-password-reset";

export async function requestPasswordReset(
  _prevState: { sent: true } | undefined,
  formData: FormData
): Promise<{ sent: true }> {
  const email = String(formData.get("email") ?? "");
  try {
    const validated = RequestPasswordResetSchema.parse({ email });

    const [found] = await db
      .select({ id: schema.user.id, name: schema.user.name, passwordSet: schema.user.passwordSet })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.email, validated.email),
          isNull(schema.user.deletedAt)
        )
      );

    // Silencieux si user inexistant ou sans mot de passe défini (pas d'énumération)
    if (!found || !found.passwordSet) {
      return { sent: true };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 heure
    const token = crypto.randomUUID();

    await db.transaction(async (tx) => {
      // Invalide les tokens précédents non utilisés de cet utilisateur
      await tx
        .delete(schema.passwordReset)
        .where(eq(schema.passwordReset.userId, found.id));

      await tx.insert(schema.passwordReset).values({
        userId: found.id,
        token,
        expiresAt,
      });
    });

    await sendPasswordResetEmail({
      to: validated.email,
      name: found.name,
      token,
    });

    return { sent: true };
  } catch {
    // On ne propage jamais d'erreur interne — même réponse côté client
    return { sent: true };
  }
}
