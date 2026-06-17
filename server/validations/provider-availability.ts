import { z } from "zod";

export const AvailabilityKind = z.enum(["available", "unavailable"]);

export const CreateAvailabilitySchema = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    kind: AvailabilityKind.default("available"),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });
export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;

/**
 * Exception ponctuelle sur une date donnée (onglet "Exceptions").
 * `kind = 'unavailable'` → bloque la plage (ou journée entière si pas d'heure).
 * `kind = 'available'` → ajoute un créneau pour cette plage (ou journée entière).
 * `startTime`/`endTime` optionnels au format "HH:MM" (heure Guadeloupe).
 * Si omis → comportement journée entière (00:00–24:00).
 */
export const CreateDateExceptionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date ISO YYYY-MM-DD invalide"),
    kind: AvailabilityKind,
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure HH:MM invalide")
      .optional(),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure HH:MM invalide")
      .optional(),
  })
  .refine(
    (d) => {
      if (d.startTime && d.endTime) return d.endTime > d.startTime;
      return true;
    },
    { message: "Fin doit être après début", path: ["endTime"] }
  )
  .refine(
    (d) => {
      // Les deux doivent être fournis ou aucun
      const hasStart = !!d.startTime;
      const hasEnd = !!d.endTime;
      return hasStart === hasEnd;
    },
    { message: "Début et fin doivent être fournis ensemble", path: ["endTime"] }
  );
export type CreateDateExceptionInput = z.infer<typeof CreateDateExceptionSchema>;

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
