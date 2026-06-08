import "server-only";

import { eq, isNull, and, asc, gte, lte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function resolveProviderFromUser(userId: string) {
  const [row] = await db
    .select({ id: schema.provider.id })
    .from(schema.provider)
    .where(and(eq(schema.provider.userId, userId), isNull(schema.provider.deletedAt)));
  return row ?? null;
}

export async function getMyAvailabilities(providerId: string) {
  return db
    .select({
      id: schema.providerAvailability.id,
      startAt: schema.providerAvailability.startAt,
      endAt: schema.providerAvailability.endAt,
      kind: schema.providerAvailability.kind,
    })
    .from(schema.providerAvailability)
    .where(
      and(
        eq(schema.providerAvailability.providerId, providerId),
        isNull(schema.providerAvailability.deletedAt)
      )
    )
    .orderBy(asc(schema.providerAvailability.startAt));
}

export type ProviderAvailabilityRow = Awaited<ReturnType<typeof getMyAvailabilities>>[number];

/**
 * Créneaux d'un prestataire chevauchant la fenêtre [from, to].
 * (startAt < to AND endAt > from)
 */
export async function getMyAvailabilitiesInRange(providerId: string, from: Date, to: Date) {
  return db
    .select({
      id: schema.providerAvailability.id,
      startAt: schema.providerAvailability.startAt,
      endAt: schema.providerAvailability.endAt,
      kind: schema.providerAvailability.kind,
    })
    .from(schema.providerAvailability)
    .where(
      and(
        eq(schema.providerAvailability.providerId, providerId),
        isNull(schema.providerAvailability.deletedAt),
        lte(schema.providerAvailability.startAt, to),
        gte(schema.providerAvailability.endAt, from)
      )
    )
    .orderBy(asc(schema.providerAvailability.startAt));
}
