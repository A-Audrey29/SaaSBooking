import { z } from "zod";

export const AssignProviderSchema = z.object({
  projectId: z.string().uuid(),
  providerId: z.string().uuid(),
  metierId: z.string().uuid(),
});

export const RemoveAssignmentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
});

export type AssignProviderInput = z.infer<typeof AssignProviderSchema>;
export type RemoveAssignmentInput = z.infer<typeof RemoveAssignmentSchema>;
