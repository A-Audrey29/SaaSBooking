import { z } from "zod";

/**
 * Centre validation schemas.
 */

export const CreateCentreSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire").trim(),
  ville: z.string().min(1, "La ville est obligatoire").trim(),
  adresse: z.string().optional(),
  timezone: z.string().default("America/Guadeloupe"),
  telephone: z.string().optional(),
  email: z
    .string()
    .email("Format email invalide")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const UpdateCentreSchema = CreateCentreSchema.extend({
  id: z.string().uuid("ID invalide"),
});

export type CreateCentreInput = z.infer<typeof CreateCentreSchema>;
export type UpdateCentreInput = z.infer<typeof UpdateCentreSchema>;
