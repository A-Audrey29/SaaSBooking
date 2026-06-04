import { z } from "zod";

export const CreateSessionGroupSchema = z.object({
  workshopId: z.string().uuid(),
  workshopRoleGroupId: z.string().uuid(),
  checkedSlotIds: z.array(z.string().uuid()).min(1, "Au moins un rôle requis"),
  nom: z.string().min(1).max(200).trim(),
  notes: z.string().max(1000).trim().optional(),
  dates: z
    .array(
      z.object({
        startAt: z.string().datetime(),
        endAt: z.string().datetime(),
      })
    )
    .min(1, "Au moins une séance requise")
    .max(20),
});

export type CreateSessionGroupInput = z.infer<typeof CreateSessionGroupSchema>;
