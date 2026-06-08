import { z } from "zod";

export const CreateAvailabilitySchema = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });
export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;

export const DeleteAvailabilitySchema = z.object({
  availabilityId: z.string().uuid(),
});
export type DeleteAvailabilityInput = z.infer<typeof DeleteAvailabilitySchema>;

/**
 * Déploiement de disponibilités récurrentes en créneaux datés.
 *
 * `weekdays` : matrice 7 entrées, index 0 = lundi … 6 = dimanche.
 * Chaque jour activé porte ses plages horaires "HH:MM" (heure Guadeloupe).
 * La fenêtre [from, to] (ISO "YYYY-MM-DD") borne la génération.
 */
const TimeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure HH:MM invalide");

const RecurringRangeSchema = z
  .object({ start: TimeString, end: TimeString })
  .refine((r) => r.end > r.start, { message: "Fin doit être après début", path: ["end"] });

const RecurringDaySchema = z.object({
  enabled: z.boolean(),
  ranges: z.array(RecurringRangeSchema),
});

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date ISO YYYY-MM-DD invalide");

export const CreateRecurringAvailabilitiesSchema = z
  .object({
    weekdays: z.array(RecurringDaySchema).length(7),
    from: IsoDate,
    to: IsoDate,
  })
  .refine((d) => d.to >= d.from, { message: "to doit être >= from", path: ["to"] });
export type CreateRecurringAvailabilitiesInput = z.infer<typeof CreateRecurringAvailabilitiesSchema>;
