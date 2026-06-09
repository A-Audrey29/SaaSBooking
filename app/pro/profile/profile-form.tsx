"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  UpdateMyProviderProfileSchema,
  type UpdateMyProviderProfileInput,
} from "@/server/validations/provider";
import { updateMyProviderProfile } from "./actions";

interface ProfileFormProps {
  defaultValues: UpdateMyProviderProfileInput;
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateMyProviderProfileInput>({
    resolver: zodResolver(UpdateMyProviderProfileSchema),
    defaultValues,
  });

  const onSubmit = (data: UpdateMyProviderProfileInput) => {
    startTransition(async () => {
      const result = await updateMyProviderProfile(data);
      if (result.ok) {
        form.setError("root", { message: "✓ Profil mis à jour" });
        setTimeout(() => form.clearErrors("root"), 3000);
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  const rootError = form.formState.errors.root?.message;
  const isSuccess = rootError?.startsWith("✓");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="0690 00 00 00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ville"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville / Zone d&apos;intervention</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Pointe-à-Pitre" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Présentation</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={4}
                  placeholder="Décrivez votre parcours et vos spécialités…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {rootError && (
          <p className={`text-sm ${isSuccess ? "text-green-600" : "text-destructive"}`}>
            {rootError}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
