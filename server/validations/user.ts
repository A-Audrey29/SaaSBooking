import { z } from "zod";

const roleEnum = z.enum(["super_admin", "referent", "provider"]);

export const CreateUserSchema = z
  .object({
    email: z.string().email("Format email invalide").toLowerCase().trim(),
    name: z.string().min(2, "Nom min 2 caractères").max(100, "Nom max 100 caractères").trim(),
    role: roleEnum,
    centreId: z.string().uuid("centreId invalide").nullable().default(null),
  })
  .refine(
    (data) => {
      if (data.role === "referent") return data.centreId !== null;
      return true;
    },
    { message: "centreId requis pour le rôle referent", path: ["centreId"] }
  )
  .refine(
    (data) => {
      if (data.role === "super_admin" || data.role === "provider")
        return data.centreId === null;
      return true;
    },
    { message: "centreId doit être null pour super_admin et provider", path: ["centreId"] }
  );

export const UpdateUserSchema = z
  .object({
    id: z.string().uuid("ID invalide"),
    role: roleEnum,
    centreId: z.string().uuid("centreId invalide").nullable().default(null),
  })
  .refine(
    (data) => {
      if (data.role === "referent") return data.centreId !== null;
      return true;
    },
    { message: "centreId requis pour le rôle referent", path: ["centreId"] }
  )
  .refine(
    (data) => {
      if (data.role === "super_admin" || data.role === "provider")
        return data.centreId === null;
      return true;
    },
    { message: "centreId doit être null pour super_admin et provider", path: ["centreId"] }
  );

export const SoftDeleteUserSchema = z.object({
  id: z.string().uuid("ID invalide"),
});

export const ResendInvitationSchema = z.object({
  id: z.string().uuid("ID invalide"),
});

export const SetupPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Mot de passe min 8 caractères"),
});

export const RequestPasswordResetSchema = z.object({
  email: z.string().email("Format email invalide").toLowerCase().trim(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Mot de passe min 8 caractères"),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(8, "Nouveau mot de passe min 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type SoftDeleteUserInput = z.infer<typeof SoftDeleteUserSchema>;
export type ResendInvitationInput = z.infer<typeof ResendInvitationSchema>;
export type SetupPasswordInput = z.infer<typeof SetupPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
