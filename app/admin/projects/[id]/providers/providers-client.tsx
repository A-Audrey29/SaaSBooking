"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  AssignProviderSchema,
  type AssignProviderInput,
} from "@/server/validations/provider-assignment";
import { assignProvider, removeAssignment } from "./provider-assignment.actions";

interface Assignment {
  id: string;
  metierId: string;
  metierNom: string;
  createdAt: Date;
  providerId: string;
  providerNom: string;
  providerEmail: string;
}

interface AvailableProvider {
  id: string;
  nom: string;
  metierId: string | null;
  metierNom: string | null;
}

interface Metier {
  id: string;
  nom: string;
}

interface Props {
  projectId: string;
  assignments: Assignment[];
  availableProviders: AvailableProvider[];
  metiers: Metier[];
}

export function ProvidersClient({ projectId, assignments, availableProviders, metiers }: Props) {
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AssignProviderInput>({
    resolver: zodResolver(AssignProviderSchema),
    defaultValues: { projectId, providerId: "", metierId: "" },
  });

  const onSubmit = (data: AssignProviderInput) => {
    startTransition(async () => {
      const result = await assignProvider(data);
      if (result.ok) {
        form.reset({ projectId, providerId: "", metierId: "" });
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  const handleRemoveConfirm = () => {
    if (!removeTargetId) return;
    startTransition(async () => {
      const result = await removeAssignment({ id: removeTargetId, projectId });
      if (!result.ok) console.error("Erreur retrait:", result.error);
      setRemoveTargetId(null);
    });
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold mb-4">Prestataires affectés</h2>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Métier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Aucun prestataire affecté
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <div>{a.providerNom}</div>
                      <div className="text-xs text-muted-foreground">{a.providerEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.metierNom}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveTargetId(a.id)}
                        disabled={isPending}
                      >
                        Retirer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Separator />

      <section className="max-w-md">
        <h2 className="text-base font-semibold mb-4">Affecter un prestataire</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prestataire</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un prestataire" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProviders.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom}{p.metierNom ? ` — ${p.metierNom}` : ""}
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
              name="metierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Métier pour ce projet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un métier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Affectation…" : "Affecter"}
            </Button>
          </form>
        </Form>
      </section>

      <AlertDialog
        open={removeTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce prestataire ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;affectation sera désactivée. Cette action est réversible par un administrateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
