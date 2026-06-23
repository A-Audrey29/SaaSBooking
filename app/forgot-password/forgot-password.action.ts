"use server";

import { eq, isNull, and, isNotNull } from "drizzle-orm";
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
      .select({ id: schema.user.id, name: schema.user.name })
      .from(schema.user)
      .innerJoin(
        schema.account,
        and(
          eq(schema.account.userId, schema.user.id),
          eq(schema.account.providerId, "credential"),
          isNotNull(schema.account.password)
        )
      )
      .where(
        and(
          eq(schema.user.email, validated.email),
          isNull(schema.user.deletedAt)
        )
      );

    // Silencieux si user inexistant ou sans password credential (pas d'énumération)
    if (!found) {
      return { sent: true };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 heure
    const token = crypto.randomUUID();

    await db.transaction(async (tx) => {
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
