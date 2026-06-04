"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CreateRoleSlotSchema,
  UpdateRoleSlotSchema,
  type CreateRoleSlotInput,
  type UpdateRoleSlotInput,
} from "@/server/validations/workshop";
import { createRoleSlot, updateRoleSlot } from "./workshops.actions";

interface RoleSlotFormProps {
  workshopRoleGroupId: string;
  defaultValues?: {
    id?: string;
    role?: string;
    couleur?: string;
    isOptional?: boolean;
    ordre?: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

type FormValues = CreateRoleSlotInput & { id?: string };

export function RoleSlotForm({
  workshopRoleGroupId,
  defaultValues,
  onSuccess,
  onCancel,
}: RoleSlotFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(defaultValues?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? UpdateRoleSlotSchema : CreateRoleSlotSchema),
    defaultValues: {
      id: defaultValues?.id,
      workshopRoleGroupId,
      role: defaultValues?.role ?? "",
      couleur: defaultValues?.couleur ?? "",
      isOptional: defaultValues?.isOptional ?? false,
      ordre: defaultValues?.ordre ?? 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...data,
        couleur: data.couleur?.trim() === "" ? null : data.couleur,
      };
      const result = isEdit
        ? await updateRoleSlot(payload as UpdateRoleSlotInput)
        : await createRoleSlot(payload as CreateRoleSlotInput);

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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Psychologue" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="couleur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur (hex)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="#1f3a5f"
                    className="font-mono"
                  />
                  {field.value && /^#[0-9A-Fa-f]{6}$/.test(field.value) && (
                    <span
                      className="inline-block w-8 h-8 rounded border flex-shrink-0"
                      style={{ backgroundColor: field.value }}
                    />
                  )}
                </div>
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

        <FormField
          control={form.control}
          name="isOptional"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Optionnel</FormLabel>
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
