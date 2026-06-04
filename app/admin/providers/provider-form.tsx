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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateProviderSchema,
  UpdateProviderSchema,
  type CreateProviderInput,
  type UpdateProviderInput,
} from "@/server/validations/provider";
import { createProvider, updateProvider } from "./providers.actions";

interface Metier {
  id: string;
  nom: string;
}

interface ProviderRow {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  ville: string | null;
  metierId: string | null;
  bio: string | null;
}

interface SharedProps {
  metiers: Metier[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface CreateProps extends SharedProps {
  mode: "create";
  provider?: undefined;
}

interface EditProps extends SharedProps {
  mode: "edit";
  provider: ProviderRow;
}

export type ProviderFormProps = CreateProps | EditProps;

function CreateProviderForm({ metiers, onSuccess, onCancel }: SharedProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateProviderInput>({
    resolver: zodResolver(CreateProviderSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: null,
      ville: null,
      metierId: null,
      bio: null,
    },
  });

  const onSubmit = (data: CreateProviderInput) => {
    startTransition(async () => {
      const result = await createProvider(data);
      if (result.ok) {
        onSuccess();
      } else {
        form.setError("root", { message: result.error });
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
                <Input {...field} placeholder="Prénom Nom ou raison sociale" />
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
                <Input {...field} type="email" placeholder="contact@exemple.fr" />
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
        <FormField
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder="0590 xx xx xx"
                />
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
                <Input
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder="Pointe-à-Pitre"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio / Présentation</FormLabel>
              <FormControl>
                <Textarea
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  rows={3}
                />
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement…" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditProviderForm({ provider, metiers, onSuccess, onCancel }: EditProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProviderInput>({
    resolver: zodResolver(UpdateProviderSchema),
    defaultValues: {
      id: provider.id,
      nom: provider.nom,
      email: provider.email,
      telephone: provider.telephone ?? null,
      ville: provider.ville ?? null,
      metierId: provider.metierId ?? null,
      bio: provider.bio ?? null,
    },
  });

  const onSubmit = (data: UpdateProviderInput) => {
    startTransition(async () => {
      const result = await updateProvider(data);
      if (result.ok) {
        onSuccess();
      } else {
        form.setError("root", { message: result.error });
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
                <Input {...field} />
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
                <Input {...field} type="email" />
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
        <FormField
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
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
                <Input
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio / Présentation</FormLabel>
              <FormControl>
                <Textarea
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  rows={3}
                />
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
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

export function ProviderForm(props: ProviderFormProps) {
  if (props.mode === "edit") {
    return <EditProviderForm {...props} />;
  }
  return <CreateProviderForm {...props} />;
}
