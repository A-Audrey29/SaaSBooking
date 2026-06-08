import "server-only";

import { eq, and, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import type { ServerContext } from "@/server/context/server-context";
import { resolveProviderFromUser } from "@/server/queries/provider-availability";
import type { CreateAvailabilityInput, DeleteAvailabilityInput } from "@/server/validations/provider-availability";

export async function createAvailability(
  input: CreateAvailabilityInput,
  ctx: ServerContext
): Promise<void> {
  const prov = await resolveProviderFromUser(ctx.userId);
  if (!prov) throw new Error("Aucun prestataire associé à ce compte");

  await db.insert(schema.providerAvailability).values({
    providerId: prov.id,
    startAt: input.startAt,
    endAt: input.endAt,
  });
}

export async function deleteAvailability(
  input: DeleteAvailabilityInput,
  ctx: ServerContext
): Promise<void> {
  const prov = await resolveProviderFromUser(ctx.userId);
  if (!prov) throw new Error("Aucun prestataire associé à ce compte");

  const result = await db
    .update(schema.providerAvailability)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(schema.providerAvailability.id, input.availabilityId),
        eq(schema.providerAvailability.providerId, prov.id), // ownership check
        isNull(schema.providerAvailability.deletedAt)
      )
    );

  if (!result.rowCount) throw new Error("Disponibilité introuvable ou déjà supprimée");
}
