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
  console.log("[forgot-password] 1. action appelée, email:", email);

  try {
    const validated = RequestPasswordResetSchema.parse({ email });
    console.log("[forgot-password] 2. email validé:", validated.email);

    const [found] = await db
      .select({ id: schema.user.id, name: schema.user.name, passwordSet: schema.user.passwordSet })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.email, validated.email),
          isNull(schema.user.deletedAt)
        )
      );

    console.log("[forgot-password] 3. user trouvé:", found ? { id: found.id, passwordSet: found.passwordSet } : "non trouvé");

    if (!found || !found.passwordSet) {
      console.log("[forgot-password] 4. STOP — user inexistant ou passwordSet=false");
      return { sent: true };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const token = crypto.randomUUID();

    console.log("[forgot-password] 5. insertion token en base...");
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
    console.log("[forgot-password] 6. token inséré en base");

    console.log("[forgot-password] 7. envoi email...");
    const result = await sendPasswordResetEmail({
      to: validated.email,
      name: found.name,
      token,
    });
    console.log("[forgot-password] 8. résultat envoi email:", result);

    return { sent: true };
  } catch (error) {
    console.error("[forgot-password] ERREUR:", error);
    return { sent: true };
  }
}
