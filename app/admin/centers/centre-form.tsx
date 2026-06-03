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
import {
  CreateCentreSchema,
  UpdateCentreSchema,
  type CreateCentreInput,
  type UpdateCentreInput,
} from "@/server/validations/centre";
import { createCentre, updateCentre } from "./centres.actions";

interface CentreFormProps {
  defaultValues?: {
    id?: string;
    nom?: string;
    ville?: string;
    adresse?: string;
    timezone?: string;
    telephone?: string;
    email?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function CentreForm({
  defaultValues,
  onSuccess,
  onCancel,
}: CentreFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(defaultValues?.id);

  const form = useForm<CreateCentreInput | UpdateCentreInput>({
    resolver: zodResolver(isEdit ? UpdateCentreSchema : CreateCentreSchema),
    defaultValues: {
      id: defaultValues?.id,
      nom: defaultValues?.nom ?? "",
      ville: defaultValues?.ville ?? "",
      adresse: defaultValues?.adresse ?? "",
      timezone: defaultValues?.timezone ?? "America/Guadeloupe",
      telephone: defaultValues?.telephone ?? "",
      email: defaultValues?.email ?? "",
    },
  });

  const onSubmit = (data: CreateCentreInput | UpdateCentreInput) => {
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateCentre(data as UpdateCentreInput);
        } else {
          await createCentre(data as CreateCentreInput);
        }
        onSuccess();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Une erreur est survenue";
        form.setError("root", { message });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Centre social..." />
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
              <FormLabel>Ville</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Les Abymes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="adresse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Input {...field} placeholder="12 rue de la Paix..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuseau horaire</FormLabel>
              <FormControl>
                <Input {...field} placeholder="America/Guadeloupe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="0590 12 34 56" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="contact@centre.gp" />
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

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
