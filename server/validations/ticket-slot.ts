import { z } from "zod";

export const AssignProviderSchema = z.object({
  slotId: z.string().uuid(),
  providerId: z.string().uuid(),
  sessionGroupId: z.string().uuid(), // for revalidatePath
});
export type AssignProviderInput = z.infer<typeof AssignProviderSchema>;

export const CancelRequestSchema = z.object({
  slotId: z.string().uuid(),
  sessionGroupId: z.string().uuid(),
});
export type CancelRequestInput = z.infer<typeof CancelRequestSchema>;

export const SkipSlotSchema = z.object({
  slotId: z.string().uuid(),
  sessionGroupId: z.string().uuid(),
});
export type SkipSlotInput = z.infer<typeof SkipSlotSchema>;
