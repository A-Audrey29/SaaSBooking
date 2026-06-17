"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { MetierForm } from "./metier-form";
import { softDeleteMetier } from "./metiers.actions";

interface Metier {
  id: string;
  nom: string;
  color: string | null;
  createdAt: Date;
}

interface MetiersClientProps {
  metiers: Metier[];
}

export function MetiersClient({ metiers }: MetiersClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMetier, setSelectedMetier] = useState<Metier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Metier | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setSelectedMetier(null);
    setSheetOpen(true);
  };

  const handleEdit = (m: Metier) => {
    setSelectedMetier(m);
    setSheetOpen(true);
  };


  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedMetier(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await softDeleteMetier({ id: deleteTarget.id });
      if (result.ok) {
        setDeleteTarget(null);
      } else {
        setDeleteError(result.error);
      }
    });
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[800px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Métiers</h1>
        <Button onClick={handleCreate}>+ Nouveau métier</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Aucun métier défini
                </TableCell>
              </TableRow>
            ) : (
              metiers.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {m.color ? (
                        <span
                          className="inline-block h-4 w-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: m.color }}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="inline-block h-4 w-4 rounded-full flex-shrink-0 border border-dashed border-muted-foreground/40" aria-hidden="true" />
                      )}
                      {m.nom}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(m)}>
                      Renommer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(m);
                      }}
                      disabled={isPending}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedMetier ? "Renommer le métier" : "Nouveau métier"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedMetier ? (
              <MetierForm
                mode="edit"
                metier={selectedMetier}
                onSuccess={handleSheetClose}
                onCancel={handleSheetClose}
              />
            ) : (
              <MetierForm
                mode="create"
                onSuccess={handleSheetClose}
                onCancel={handleSheetClose}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce métier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le métier <strong>{deleteTarget?.nom}</strong> sera désactivé. Impossible si déjà utilisé dans un atelier ou par un prestataire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
