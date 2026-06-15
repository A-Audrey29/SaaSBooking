import { z } from "zod";

export const UpdateProviderSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(2).max(200).trim(),
  email: z.string().email().trim(),
  telephone: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(30).trim().nullable()
  ),
  ville: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(100).trim().nullable()
  ),
  metierId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().uuid().nullable()
  ),
  bio: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(2000).trim().nullable()
  ),
});

export const SoftDeleteProviderSchema = z.object({
  id: z.string().uuid(),
});

// Auto-création du profil par le prestataire lui-même (provider.userId = ctx.userId).
export const CreateMyProviderProfileSchema = z.object({
  nom: z.string().min(2).max(200).trim(),
  telephone: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(30).trim().nullable()
  ),
  ville: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(100).trim().nullable()
  ),
  metierId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().uuid().nullable()
  ),
  bio: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(2000).trim().nullable()
  ),
});

// Self-edit: only non-sensitive fields. nom/email/metier = admin only.
export const UpdateMyProviderProfileSchema = z.object({
  telephone: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(30).trim().nullable()
  ),
  ville: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(100).trim().nullable()
  ),
  bio: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(2000).trim().nullable()
  ),
});

export type UpdateProviderInput = z.infer<typeof UpdateProviderSchema>;
export type SoftDeleteProviderInput = z.infer<typeof SoftDeleteProviderSchema>;
export type CreateMyProviderProfileInput = z.infer<typeof CreateMyProviderProfileSchema>;
export type UpdateMyProviderProfileInput = z.infer<typeof UpdateMyProviderProfileSchema>;
