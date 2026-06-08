import { z } from "zod";

export const CreateAvailabilitySchema = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });
export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;

export const DeleteAvailabilitySchema = z.object({
  availabilityId: z.string().uuid(),
});
export type DeleteAvailabilityInput = z.infer<typeof DeleteAvailabilitySchema>;
