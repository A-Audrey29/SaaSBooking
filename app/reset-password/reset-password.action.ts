"use server";

import { eq, and, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ResetPasswordSchema } from "@/server/validations/user";
import { auth } from "@/server/auth/config";

export async function resetPassword(
  input: { token: string; password: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const validated = ResetPasswordSchema.parse(input);
    const now = new Date();

    await db.transaction(async (tx) => {
      const [reset] = await tx
        .select()
        .from(schema.passwordReset)
        .where(eq(schema.passwordReset.token, validated.token));

      if (!reset) {
        throw new Error("Lien de réinitialisation invalide ou introuvable");
      }
      if (reset.expiresAt < now) {
        throw new Error("Ce lien a expiré. Faites une nouvelle demande.");
      }
      if (reset.usedAt !== null) {
        throw new Error("Ce lien a déjà été utilisé");
      }

      const [targetUser] = await tx
        .select()
        .from(schema.user)
        .where(and(eq(schema.user.id, reset.userId), isNull(schema.user.deletedAt)));

      if (!targetUser) {
        throw new Error("Utilisateur introuvable");
      }

      const authContext = await auth.$context;
      const hash = await authContext.password.hash(validated.password);

      await tx
        .update(schema.account)
        .set({ password: hash, updatedAt: now })
        .where(
          and(
            eq(schema.account.userId, reset.userId),
            eq(schema.account.providerId, "credential")
          )
        );

      await tx
        .update(schema.passwordReset)
        .set({ usedAt: now })
        .where(eq(schema.passwordReset.id, reset.id));
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
