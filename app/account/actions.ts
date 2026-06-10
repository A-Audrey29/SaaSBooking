"use server";

import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "@/server/db/client";
import { requireAuth } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  ChangePasswordSchema,
  type ChangePasswordInput,
} from "@/server/validations/user";

export async function changePassword(
  input: ChangePasswordInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireAuth();
    const validated = ChangePasswordSchema.parse(input);

    await db.transaction(async (tx) => {
      // Fetch current credential account
      const [account] = await tx
        .select({ id: schema.account.id, password: schema.account.password })
        .from(schema.account)
        .where(
          and(
            eq(schema.account.userId, ctx.userId),
            eq(schema.account.providerId, "credential")
          )
        );

      if (!account || !account.password) {
        throw new Error("Aucun mot de passe défini sur ce compte");
      }

      const valid = await bcrypt.compare(validated.currentPassword, account.password);
      if (!valid) {
        throw new Error("Mot de passe actuel incorrect");
      }

      const hash = await bcrypt.hash(validated.newPassword, 10);

      await tx
        .update(schema.account)
        .set({ password: hash, updatedAt: new Date() })
        .where(eq(schema.account.id, account.id));

      await logAudit(ctx, "update", "user", ctx.userId, { passwordChanged: false }, { passwordChanged: true });
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
