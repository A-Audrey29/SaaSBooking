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
  metierId: z.string().uuid(),
  isOptional: z.boolean().default(false),
  ordre: z.number().int().default(0),
});

export const UpdateRoleSlotSchema = z.object({
  id: z.string().uuid(),
  metierId: z.string().uuid(),
  isOptional: z.boolean().default(false),
  ordre: z.number().int().default(0),
});

// -- QuickCreate (type + group + slots in one transaction) --

export const QuickCreateWorkshopTypeSchema = z.object({
  centreId: z.preprocess((v) => (v === "" ? null : v), z.string().uuid().nullable()),
  code: z.string().min(2).max(50).trim().transform((v) => v.toUpperCase()),
  nom: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  metierIds: z.array(z.string().uuid()).min(1, "Sélectionner au moins 1 métier"),
});

export type QuickCreateWorkshopTypeInput = z.infer<typeof QuickCreateWorkshopTypeSchema>;

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
