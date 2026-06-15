"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateMyProviderProfileSchema,
  UpdateMyProviderProfileSchema,
  type CreateMyProviderProfileInput,
  type UpdateMyProviderProfileInput,
} from "@/server/validations/provider";
import { createMyProviderProfile, updateMyProviderProfile } from "./actions";

interface Metier {
  id: string;
  nom: string;
}

interface ProfileCreateFormProps {
  metiers: Metier[];
}

export function ProfileCreateForm({ metiers }: ProfileCreateFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateMyProviderProfileInput>({
    resolver: zodResolver(
      CreateMyProviderProfileSchema
    ) as Resolver<CreateMyProviderProfileInput>,
    defaultValues: {
      nom: "",
      telephone: null,
      ville: null,
      metierId: null,
      bio: null,
    },
  });

  const onSubmit = (data: CreateMyProviderProfileInput) => {
    startTransition(async () => {
      const result = await createMyProviderProfile(data);
      if (!result.ok) {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Prénom Nom ou raison sociale" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="metierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Métier</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                value={field.value ?? "__none__"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un métier (optionnel)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">— Aucun —</SelectItem>
                  {metiers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Création…" : "Créer mon profil"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface ProfileFormProps {
  defaultValues: UpdateMyProviderProfileInput;
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateMyProviderProfileInput>({
    resolver: zodResolver(
      UpdateMyProviderProfileSchema
    ) as Resolver<UpdateMyProviderProfileInput>,
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
