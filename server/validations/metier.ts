import { z } from "zod";

export const CreateMetierSchema = z.object({
  nom: z.string().min(2).max(100).trim(),
});

export const UpdateMetierSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(2).max(100).trim(),
});

export const SoftDeleteMetierSchema = z.object({
  id: z.string().uuid(),
});

export type CreateMetierInput = z.infer<typeof CreateMetierSchema>;
export type UpdateMetierInput = z.infer<typeof UpdateMetierSchema>;
export type SoftDeleteMetierInput = z.infer<typeof SoftDeleteMetierSchema>;
