import { z } from "zod";

// -- WorkshopType --

export const CreateWorkshopTypeSchema = z.object({
  centreId: z.preprocess((v) => (v === "" ? null : v), z.string().uuid().nullable()),
  code: z.string().min(2).max(50).trim().transform((v) => v.toUpperCase()),
  nom: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
});

export const UpdateWorkshopTypeSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2).max(50).trim().transform((v) => v.toUpperCase()),
  nom: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
});

// -- RoleGroup --

export const CreateRoleGroupSchema = z.object({
  workshopTypeId: z.string().uuid(),
  label: z.string().min(2).max(200).trim(),
  ordre: z.number().int().default(0),
});

export const UpdateRoleGroupSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(2).max(200).trim(),
  ordre: z.number().int().default(0),
});

// -- RoleSlot --

export const CreateRoleSlotSchema = z.object({
  workshopRoleGroupId: z.string().uuid(),
  role: z.string().min(1).max(100).trim(),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  isOptional: z.boolean().default(false),
  ordre: z.number().int().default(0),
});

export const UpdateRoleSlotSchema = z.object({
  id: z.string().uuid(),
  role: z.string().min(1).max(100).trim(),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  isOptional: z.boolean().default(false),
  ordre: z.number().int().default(0),
});

// -- Shared --

export const SoftDeleteSchema = z.object({
  id: z.string().uuid(),
});

// -- Inferred types --

export type CreateWorkshopTypeInput = z.infer<typeof CreateWorkshopTypeSchema>;
export type UpdateWorkshopTypeInput = z.infer<typeof UpdateWorkshopTypeSchema>;
export type CreateRoleGroupInput = z.infer<typeof CreateRoleGroupSchema>;
export type UpdateRoleGroupInput = z.infer<typeof UpdateRoleGroupSchema>;
export type CreateRoleSlotInput = z.infer<typeof CreateRoleSlotSchema>;
export type UpdateRoleSlotInput = z.infer<typeof UpdateRoleSlotSchema>;
export type SoftDeleteInput = z.infer<typeof SoftDeleteSchema>;
