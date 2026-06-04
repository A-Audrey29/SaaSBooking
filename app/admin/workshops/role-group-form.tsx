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
  CreateRoleGroupSchema,
  UpdateRoleGroupSchema,
  type CreateRoleGroupInput,
  type UpdateRoleGroupInput,
} from "@/server/validations/workshop";
import { createRoleGroup, updateRoleGroup } from "./workshops.actions";

interface RoleGroupFormProps {
  workshopTypeId: string;
  defaultValues?: {
    id?: string;
    label?: string;
    ordre?: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

type FormValues = CreateRoleGroupInput & { id?: string };

export function RoleGroupForm({
  workshopTypeId,
  defaultValues,
  onSuccess,
  onCancel,
}: RoleGroupFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(defaultValues?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? UpdateRoleGroupSchema : CreateRoleGroupSchema),
    defaultValues: {
      id: defaultValues?.id,
      workshopTypeId,
      label: defaultValues?.label ?? "",
      ordre: defaultValues?.ordre ?? 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateRoleGroup(data as UpdateRoleGroupInput)
        : await createRoleGroup(data as CreateRoleGroupInput);

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
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Configuration standard" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ordre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordre</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
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
