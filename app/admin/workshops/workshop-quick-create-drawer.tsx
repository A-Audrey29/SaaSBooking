"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
  QuickCreateWorkshopTypeSchema,
  type QuickCreateWorkshopTypeInput,
} from "@/server/validations/workshop";
import { quickCreateWorkshopType } from "./workshops.actions";

type Centre = { id: string; nom: string };
type Metier = { id: string; nom: string };

interface WorkshopQuickCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  centres: Centre[];
  metiers: Metier[];
}

export function WorkshopQuickCreateDrawer({
  open,
  onClose,
  centres,
  metiers,
}: WorkshopQuickCreateDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedMetierIds, setSelectedMetierIds] = useState<string[]>([]);

  const form = useForm<QuickCreateWorkshopTypeInput>({
    resolver: zodResolver(
      QuickCreateWorkshopTypeSchema
    ) as Resolver<QuickCreateWorkshopTypeInput>,
    defaultValues: {
      centreId: null,
      code: "",
      nom: "",
      description: "",
      metierIds: [],
    },
  });

  function toggleMetier(id: string) {
    setSelectedMetierIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      form.setValue("metierIds", next, { shouldValidate: true });
      return next;
    });
  }

  function handleClose() {
    form.reset();
    setSelectedMetierIds([]);
    onClose();
  }

  const onSubmit = (data: QuickCreateWorkshopTypeInput) => {
    startTransition(async () => {
      const result = await quickCreateWorkshopType({ ...data, metierIds: selectedMetierIds });
      if (result.ok) {
        handleClose();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto">
        <SheetHeader className="pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Catalogue</p>
          <SheetTitle>Nouvel atelier</SheetTitle>
          <SheetDescription className="sr-only">
            Créer un nouveau type d'atelier avec ses rôles métier requis.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 flex-1">

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Nom de l'atelier
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ex. Gestion des émotions" />
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
                  <FormLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Description (optionnelle)
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Objectifs, public visé…" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="GESTION_EMOTIONS"
                      className="uppercase font-mono"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="centreId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Centre (optionnel)
                  </FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "__global__" ? null : v)}
                    value={field.value ?? "__global__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Global (tous centres)" />
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

            {/* Métiers requis */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Rôles métier requis
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Cliquer pour sélectionner les métiers nécessaires à cet atelier. Chaque métier sélectionné devient un slot (1 personne).
              </p>
              <div className="flex flex-wrap gap-2">
                {metiers.map((m) => {
                  const active = selectedMetierIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMetier(m.id)}
                      className={[
                        "text-xs px-3 py-1 rounded-full border transition-colors",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground/50",
                      ].join(" ")}
                    >
                      {m.nom}
                    </button>
                  );
                })}
              </div>
              {selectedMetierIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {selectedMetierIds.map((id) => {
                    const m = metiers.find((x) => x.id === id);
                    return m ? (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {m.nom}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              {form.formState.errors.metierIds && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.metierIds.message}
                </p>
              )}
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <SheetFooter className="mt-auto pt-4 gap-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Création…" : "Créer l'atelier"}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Annuler
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
