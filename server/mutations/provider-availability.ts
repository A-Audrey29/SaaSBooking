import "server-only";

import { eq, and, isNull, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import type { ServerContext } from "@/server/context/server-context";
import {
  resolveProviderFromUser,
  getMyAvailabilitiesInRange,
} from "@/server/queries/provider-availability";
import { getMyConfirmedBookings } from "@/server/queries/provider-bookings";
import type {
  CreateAvailabilityInput,
  DeleteAvailabilityInput,
  CreateRecurringAvailabilitiesInput,
} from "@/server/validations/provider-availability";
import {
  addDaysISO,
  partsFromISO,
  gpDateTimeToUtc,
} from "@/app/pro/dispos/lib/dates";

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

/**
 * Remplace les disponibilités du prestataire sur la fenêtre [from, to] par
 * le planning récurrent fourni (par jour de semaine).
 *
 * Comportement "remplacement total" (décision produit) :
 * 1. Les créneaux existants sur la fenêtre QUI NE CHEVAUCHENT AUCUN booking
 *    confirmé sont soft-supprimés (l'éditeur récurrent devient la source de
 *    vérité de la fenêtre).
 * 2. Les créneaux qui chevauchent un booking confirmé sont conservés intacts
 *    (jamais cassés par une réédition de planning).
 * 3. Les nouveaux créneaux sont générés pour les jours/plages cochés.
 *
 * Retourne le nombre de créneaux créés et supprimés.
 */
export async function createRecurringAvailabilities(
  input: CreateRecurringAvailabilitiesInput,
  ctx: ServerContext
): Promise<{ created: number; deleted: number }> {
  const prov = await resolveProviderFromUser(ctx.userId);
  if (!prov) throw new Error("Aucun prestataire associé à ce compte");

  const fromUtc = gpDateTimeToUtc(input.from, 0, 0);
  const toUtc = gpDateTimeToUtc(addDaysISO(input.to, 1), 0, 0);

  const [existing, bookings] = await Promise.all([
    getMyAvailabilitiesInRange(prov.id, fromUtc, toUtc),
    getMyConfirmedBookings(prov.id, fromUtc, toUtc),
  ]);

  // Une dispo est "protégée" si elle chevauche au moins un booking confirmé.
  const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
    aStart < bEnd && aEnd > bStart;

  const toDelete = existing.filter(
    (a) => !bookings.some((b) => overlaps(a.startAt, a.endAt, b.startAt, b.endAt))
  );

  if (toDelete.length > 0) {
    await db
      .update(schema.providerAvailability)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(schema.providerAvailability.providerId, prov.id),
          isNull(schema.providerAvailability.deletedAt),
          inArray(
            schema.providerAvailability.id,
            toDelete.map((a) => a.id)
          )
        )
      );
  }

  const values: { providerId: string; startAt: Date; endAt: Date }[] = [];

  let dayISO = input.from;
  while (dayISO <= input.to) {
    const { dow } = partsFromISO(dayISO); // 0=dim … 6=sam
    const matrixIdx = dow === 0 ? 6 : dow - 1; // 0=lun … 6=dim
    const day = input.weekdays[matrixIdx];
    if (day.enabled) {
      for (const r of day.ranges) {
        const [sh, sm] = r.start.split(":").map(Number);
        const [eh, em] = r.end.split(":").map(Number);
        values.push({
          providerId: prov.id,
          startAt: gpDateTimeToUtc(dayISO, sh, sm),
          endAt: gpDateTimeToUtc(dayISO, eh, em),
        });
      }
    }
    dayISO = addDaysISO(dayISO, 1);
  }

  if (values.length > 0) {
    await db.insert(schema.providerAvailability).values(values);
  }

  return { created: values.length, deleted: toDelete.length };
}
