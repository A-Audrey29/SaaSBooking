"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { resetPassword } from "./reset-password.action";

const ResetPasswordFormSchema = z
  .object({
    password: z.string().min(8, "Mot de passe min 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;

interface ResetPasswordClientProps {
  token: string;
}

export function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ResetPasswordFormInput) => {
    startTransition(async () => {
      const result = await resetPassword({ token, password: data.password });
      if (result.ok) {
        router.push("/login?reset=success");
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>
          <p className="text-muted-foreground">
            Choisissez un nouveau mot de passe pour votre compte ResaPresta.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="8 caractères minimum" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Répétez le mot de passe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
