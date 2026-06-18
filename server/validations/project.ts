import { z } from "zod";

export const CreateProjectSchema = z.object({
  centreIds: z.array(z.string().uuid()).min(1, "Au moins un centre requis"),
  nom: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  financeur: z.string().max(200).trim().optional(),
  startDate: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().date().nullable()
  ),
  endDate: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().date().nullable()
  ),
});

export const UpdateProjectSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  financeur: z.string().max(200).trim().optional(),
  startDate: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().date().nullable()
  ),
  endDate: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().date().nullable()
  ),
});

export const SoftDeleteProjectSchema = z.object({
  id: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type SoftDeleteProjectInput = z.infer<typeof SoftDeleteProjectSchema>;
