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
  CreateMetierSchema,
  UpdateMetierSchema,
  type CreateMetierInput,
  type UpdateMetierInput,
} from "@/server/validations/metier";
import { createMetier, updateMetier } from "./metiers.actions";

interface SharedProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface CreateProps extends SharedProps {
  mode: "create";
  metier?: undefined;
}

interface EditProps extends SharedProps {
  mode: "edit";
  metier: { id: string; nom: string };
}

export type MetierFormProps = CreateProps | EditProps;

function CreateMetierForm({ onSuccess, onCancel }: SharedProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateMetierInput>({
    resolver: zodResolver(CreateMetierSchema),
    defaultValues: { nom: "" },
  });

  const onSubmit = (data: CreateMetierInput) => {
    startTransition(async () => {
      const result = await createMetier(data);
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
              <FormLabel>Nom du métier</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ex. Psychologue" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
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

function EditMetierForm({ metier, onSuccess, onCancel }: EditProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<UpdateMetierInput>({
    resolver: zodResolver(UpdateMetierSchema),
    defaultValues: { id: metier.id, nom: metier.nom },
  });

  const onSubmit = (data: UpdateMetierInput) => {
    startTransition(async () => {
      const result = await updateMetier(data);
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
              <FormLabel>Nom du métier</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
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

export function MetierForm(props: MetierFormProps) {
  if (props.mode === "edit") return <EditMetierForm {...props} />;
  return <CreateMetierForm {...props} />;
}
