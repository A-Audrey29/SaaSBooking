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
import { SetupPasswordSchema } from "@/server/validations/user";
import { setupPassword } from "@/app/admin/users/users.actions";

const SetupPasswordFormSchema = SetupPasswordSchema.extend({
  confirmPassword: z.string().min(1, "Confirmation requise"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SetupPasswordFormInput = z.infer<typeof SetupPasswordFormSchema>;

interface SetupPasswordClientProps {
  token: string;
}

export function SetupPasswordClient({ token }: SetupPasswordClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SetupPasswordFormInput>({
    resolver: zodResolver(SetupPasswordFormSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SetupPasswordFormInput) => {
    startTransition(async () => {
      const result = await setupPassword({ token: data.token, password: data.password });
      if (result.ok) {
        router.push("/login");
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Choisissez votre mot de passe</h1>
          <p className="text-muted-foreground">
            Créez un mot de passe pour activer votre compte ResaPresta.
            Vous pourrez ensuite vous connecter sur la page de connexion.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
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
              {isPending ? "Activation…" : "Activer mon compte"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
