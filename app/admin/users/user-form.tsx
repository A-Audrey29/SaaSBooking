"use client";

import { useTransition, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateUserSchema,
  UpdateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/server/validations/user";
import { createUser, updateUser } from "./users.actions";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  centreId: string | null;
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
  user?: undefined;
}

interface EditProps extends SharedProps {
  mode: "edit";
  user: UserRow;
}

export type UserFormProps = CreateProps | EditProps;

function CreateUserForm({ centres, onSuccess, onCancel }: SharedProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema) as Resolver<CreateUserInput>,
    defaultValues: {
      email: "",
      name: "",
      role: "referent",
      centreId: null,
    },
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    if (watchedRole !== "referent") {
      form.setValue("centreId", null);
    }
  }, [watchedRole, form]);

  const onSubmit = (data: CreateUserInput) => {
    startTransition(async () => {
      const result = await createUser(data);
      if (result.ok) {
        if (!result.emailSent) {
          // TODO: replace with sonner toast when installed
          console.warn("Compte créé — email non envoyé, utilisez Renvoyer");
        }
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="prenom.nom@exemple.fr" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Prénom Nom" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="super_admin">Super admin</SelectItem>
                  <SelectItem value="referent">Référent</SelectItem>
                  <SelectItem value="provider">Prestataire</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="centreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centre</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(val === "__none__" ? null : val)}
                value={field.value ?? "__none__"}
                disabled={watchedRole !== "referent"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un centre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">— Aucun —</SelectItem>
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
            {isPending ? "Enregistrement…" : "Inviter"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditUserForm({ user, centres, onSuccess, onCancel }: EditProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema) as Resolver<UpdateUserInput>,
    defaultValues: {
      id: user.id,
      role: user.role as UpdateUserInput["role"],
      centreId: user.centreId ?? null,
    },
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    if (watchedRole !== "referent") {
      form.setValue("centreId", null);
    }
  }, [watchedRole, form]);

  const onSubmit = (data: UpdateUserInput) => {
    startTransition(async () => {
      const result = await updateUser(data);
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
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Nom</p>
          <p className="text-sm text-muted-foreground">{user.name ?? "—"}</p>
        </div>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="super_admin">Super admin</SelectItem>
                  <SelectItem value="referent">Référent</SelectItem>
                  <SelectItem value="provider">Prestataire</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="centreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centre</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(val === "__none__" ? null : val)}
                value={field.value ?? "__none__"}
                disabled={watchedRole !== "referent"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un centre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">— Aucun —</SelectItem>
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

export function UserForm(props: UserFormProps) {
  if (props.mode === "edit") {
    return <EditUserForm {...props} />;
  }
  return <CreateUserForm {...props} />;
}
