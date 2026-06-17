import { z } from "zod";

export const CreateWorkshopSchema = z.object({
  projectId: z.string().uuid(),
  typeId: z.string().uuid().nullable().optional(),
  nom: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  seancesCount: z.coerce.number().int().min(1).max(52),
  durationMin: z.coerce.number().int().min(15).max(480),
});

export const UpdateWorkshopSchema = CreateWorkshopSchema
  .extend({ id: z.string().uuid() })
  .omit({ projectId: true });

export const SoftDeleteWorkshopSchema = z.object({
  id: z.string().uuid(),
});

export type CreateWorkshopInput = z.infer<typeof CreateWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof UpdateWorkshopSchema>;
export type SoftDeleteWorkshopInput = z.infer<typeof SoftDeleteWorkshopSchema>;
