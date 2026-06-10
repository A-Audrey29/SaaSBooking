"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ChangePasswordSchema, type ChangePasswordInput } from "@/server/validations/user";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    startTransition(async () => {
      const result = await changePassword(data);
      if (result.ok) {
        form.reset();
        form.setError("root", { message: "✓ Mot de passe modifié" });
        // Clear success message after 3s
        setTimeout(() => form.clearErrors("root"), 3000);
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  const rootError = form.formState.errors.root?.message;
  const isSuccess = rootError?.startsWith("✓");

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-[15px] font-semibold mb-5">Changer le mot de passe</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe actuel</FormLabel>
                <FormControl>
                  <Input {...field} type="password" autoComplete="current-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="new-password" placeholder="8 caractères min." />
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
                  <FormLabel>Confirmer</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {rootError && (
            <p className={`text-sm ${isSuccess ? "text-green-600" : "text-destructive"}`}>
              {rootError}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Modifier le mot de passe"}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
