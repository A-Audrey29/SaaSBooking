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
  CreateWorkshopSchema,
  UpdateWorkshopSchema,
  type CreateWorkshopInput,
  type UpdateWorkshopInput,
} from "@/server/validations/workshop-instance";
import { createWorkshop, updateWorkshop } from "./workshops.actions";

interface WorkshopRow {
  id: string;
  nom: string;
  description: string | null;
  typeId: string | null;
  seancesCount: number;
  durationMin: number;
}

interface WorkshopType {
  id: string;
  nom: string;
  code: string;
}

interface SharedProps {
  projectId: string;
  workshopTypes: WorkshopType[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface CreateProps extends SharedProps {
  mode: "create";
  workshop?: undefined;
}

interface EditProps extends SharedProps {
  mode: "edit";
  workshop: WorkshopRow;
}

export type WorkshopFormProps = CreateProps | EditProps;

function CreateWorkshopForm({ projectId, workshopTypes, onSuccess, onCancel }: SharedProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateWorkshopInput>({
    resolver: zodResolver(CreateWorkshopSchema) as Resolver<CreateWorkshopInput>,
    defaultValues: {
      projectId,
      typeId: null,
      nom: "",
      description: "",
      seancesCount: 1,
      durationMin: 90,
    },
  });

  const onSubmit = (data: CreateWorkshopInput) => {
    startTransition(async () => {
      const result = await createWorkshop(data);
      if (result.ok) {
        onSuccess();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l&apos;atelier</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ex. Gestion des émotions" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d&apos;atelier</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                value={field.value ?? "__none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none">Aucun type</SelectItem>
                  {workshopTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="seancesCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de séances</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={52} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée (min)</FormLabel>
                <FormControl>
                  <Input type="number" min={15} max={480} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
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

function EditWorkshopForm({ workshop, workshopTypes, onSuccess, onCancel }: EditProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateWorkshopInput>({
    resolver: zodResolver(UpdateWorkshopSchema) as Resolver<UpdateWorkshopInput>,
    defaultValues: {
      id: workshop.id,
      typeId: workshop.typeId ?? null,
      nom: workshop.nom,
      description: workshop.description ?? "",
      seancesCount: workshop.seancesCount,
      durationMin: workshop.durationMin,
    },
  });

  const onSubmit = (data: UpdateWorkshopInput) => {
    startTransition(async () => {
      const result = await updateWorkshop(data);
      if (result.ok) {
        onSuccess();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l&apos;atelier</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d&apos;atelier</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                value={field.value ?? "__none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none">Aucun type</SelectItem>
                  {workshopTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="seancesCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de séances</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={52} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée (min)</FormLabel>
                <FormControl>
                  <Input type="number" min={15} max={480} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
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

export function WorkshopForm(props: WorkshopFormProps) {
  if (props.mode === "edit") {
    return <EditWorkshopForm {...props} />;
  }
  return <CreateWorkshopForm {...props} />;
}
