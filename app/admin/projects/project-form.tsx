"use client";

import { useTransition } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  CreateProjectSchema,
  UpdateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/server/validations/project";
import { createProject, updateProject } from "./projects.actions";

interface ProjectCentre {
  id: string;
  nom: string;
}

interface ProjectRow {
  id: string;
  centres: ProjectCentre[];
  nom: string;
  description: string | null;
  financeur: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface Centre {
  id: string;
  nom: string;
}

interface SharedProps {
  centres: Centre[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface CreateProps extends SharedProps {
  mode: "create";
  project?: undefined;
}

interface EditProps extends SharedProps {
  mode: "edit";
  project: ProjectRow;
}

export type ProjectFormProps = CreateProps | EditProps;

function CreateProjectForm({ centres, onSuccess, onCancel }: SharedProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema) as Resolver<CreateProjectInput>,
    defaultValues: {
      centreIds: [],
      nom: "",
      description: "",
      financeur: "",
      startDate: null,
      endDate: null,
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    startTransition(async () => {
      const result = await createProject(data);
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
          name="centreIds"
          render={() => (
            <FormItem>
              <FormLabel>Centres participants</FormLabel>
              <div className="space-y-2 mt-1">
                {centres.map((centre) => (
                  <Controller
                    key={centre.id}
                    control={form.control}
                    name="centreIds"
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={field.value.includes(centre.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, centre.id]);
                            } else {
                              field.onChange(field.value.filter((id) => id !== centre.id));
                            }
                          }}
                        />
                        <span className="text-sm">{centre.nom}</span>
                      </label>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du projet</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ex. PasserelleCAP 2025" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="financeur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Financeur</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="ex. CAF Guadeloupe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de début</FormLabel>
                <FormControl>
                  <Input
                    type="date"
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
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de fin</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
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

function EditProjectForm({ project, centres, onSuccess, onCancel }: EditProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(UpdateProjectSchema) as Resolver<UpdateProjectInput>,
    defaultValues: {
      id: project.id,
      nom: project.nom,
      description: project.description ?? "",
      financeur: project.financeur ?? "",
      startDate: project.startDate ?? null,
      endDate: project.endDate ?? null,
    },
  });

  const onSubmit = (data: UpdateProjectInput) => {
    startTransition(async () => {
      const result = await updateProject(data);
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
        <div className="space-y-1">
          <p className="text-sm font-medium">Centres participants</p>
          <div className="flex flex-wrap gap-1">
            {project.centres.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun centre associé</p>
            ) : (
              project.centres.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                >
                  {c.nom}
                </span>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Pour modifier les centres, contacter un super-admin.
          </p>
        </div>
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du projet</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="financeur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Financeur</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de début</FormLabel>
                <FormControl>
                  <Input
                    type="date"
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
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de fin</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
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

export function ProjectForm(props: ProjectFormProps) {
  if (props.mode === "edit") {
    return <EditProjectForm {...props} />;
  }
  return <CreateProjectForm {...props} />;
}
