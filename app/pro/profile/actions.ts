"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { logAudit } from "@/server/queries/audit";
import {
  UpdateMyProviderProfileSchema,
  type UpdateMyProviderProfileInput,
} from "@/server/validations/provider";

export async function updateMyProviderProfile(
  input: UpdateMyProviderProfileInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireRole("provider");
    const validated = UpdateMyProviderProfileSchema.parse(input);

    await db.transaction(async (tx) => {
      // Resolve provider via userId (BDR-010)
      const [provider] = await tx
        .select({ id: schema.provider.id, telephone: schema.provider.telephone, ville: schema.provider.ville, bio: schema.provider.bio })
        .from(schema.provider)
        .where(
          and(
            eq(schema.provider.userId, ctx.userId),
            isNull(schema.provider.deletedAt)
          )
        );

      if (!provider) {
        throw new Error("Profil prestataire introuvable");
      }

      await tx
        .update(schema.provider)
        .set({
          telephone: validated.telephone,
          ville: validated.ville,
          bio: validated.bio,
          updatedAt: new Date(),
        })
        .where(eq(schema.provider.id, provider.id));

      await logAudit(
        ctx,
        "update",
        "provider",
        provider.id,
        { telephone: provider.telephone, ville: provider.ville, bio: provider.bio },
        { telephone: validated.telephone, ville: validated.ville, bio: validated.bio }
      );
    });

    revalidatePath("/pro/profile");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
