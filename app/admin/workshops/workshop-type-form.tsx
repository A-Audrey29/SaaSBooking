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
  CreateWorkshopTypeSchema,
  UpdateWorkshopTypeSchema,
  type CreateWorkshopTypeInput,
  type UpdateWorkshopTypeInput,
} from "@/server/validations/workshop";
import { createWorkshopType, updateWorkshopType } from "./workshops.actions";

type Centre = { id: string; nom: string };

interface WorkshopTypeFormProps {
  centres: Centre[];
  defaultValues?: {
    id?: string;
    centreId?: string | null;
    code?: string;
    nom?: string;
    description?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

type FormValues = CreateWorkshopTypeInput & { id?: string };

export function WorkshopTypeForm({
  centres,
  defaultValues,
  onSuccess,
  onCancel,
}: WorkshopTypeFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(defaultValues?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? UpdateWorkshopTypeSchema : CreateWorkshopTypeSchema),
    defaultValues: {
      id: defaultValues?.id,
      centreId: defaultValues?.centreId ?? null,
      code: defaultValues?.code ?? "",
      nom: defaultValues?.nom ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...data,
        centreId: data.centreId === "" || data.centreId === "__global__" ? null : data.centreId,
      };
      const result = isEdit
        ? await updateWorkshopType(payload as UpdateWorkshopTypeInput)
        : await createWorkshopType(payload as CreateWorkshopTypeInput);

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

        {isEdit ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Centre</p>
            <p className="text-sm text-muted-foreground">
              {defaultValues?.centreId
                ? centres.find((c) => c.id === defaultValues.centreId)?.nom ?? defaultValues.centreId
                : "Global (tous centres)"}
            </p>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="centreId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centre</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "__global__" ? null : v)}
                  defaultValue={field.value ?? "__global__"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un centre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__global__">Global (tous centres)</SelectItem>
                    {centres.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="PARENTALITE" className="uppercase" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Parentalité" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Description optionnelle…" rows={3} />
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
