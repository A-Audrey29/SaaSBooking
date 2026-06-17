import { z } from "zod";

export const CreateSessionGroupSchema = z.object({
  workshopId: z.string().uuid(),
  workshopRoleGroupId: z.string().uuid(),
  checkedSlotIds: z.array(z.string().uuid()).min(1, "Au moins un rôle requis"),
  nom: z.string().min(1).max(200).trim(),
  sessionNumber: z.number().int().min(1).max(999),
  seanceNumber: z.number().int().min(1).max(999),
  notes: z.string().max(1000).trim().optional(),
  // Les dates seront fixées lors du choix des disponibilités prestataires
});

export type CreateSessionGroupInput = z.infer<typeof CreateSessionGroupSchema>;
