"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { WorkshopForm } from "./workshop-form";
import { softDeleteWorkshop } from "./workshops.actions";

interface WorkshopRow {
  id: string;
  nom: string;
  description: string | null;
  typeId: string | null;
  typeNom: string | null;
  seancesCount: number;
  durationMin: number;
  centreId: string | null;
}

interface WorkshopType {
  id: string;
  nom: string;
  code: string;
}

interface WorkshopsClientProps {
  projectId: string;
  workshops: WorkshopRow[];
  workshopTypes: WorkshopType[];
}

export function WorkshopsClient({ projectId, workshops, workshopTypes }: WorkshopsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<WorkshopRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setSelected(null);
    setSheetOpen(true);
  };

  const handleEdit = (w: WorkshopRow) => {
    setSelected(w);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelected(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await softDeleteWorkshop({ id: deleteTargetId });
      if (result.ok) {
        setDeleteTargetId(null);
      } else {
        setDeleteError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>+ Ajouter un atelier</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Séances</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Visibilité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workshops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucun atelier dans ce projet
                </TableCell>
              </TableRow>
            ) : (
              workshops.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.nom}</TableCell>
                  <TableCell>{w.typeNom ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{w.seancesCount}</TableCell>
                  <TableCell>{w.durationMin} min</TableCell>
                  <TableCell>
                    {w.centreId ? (
                      <Badge variant="outline">Privé</Badge>
                    ) : (
                      <Badge variant="secondary">Global</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(w)}>
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setDeleteError(null); setDeleteTargetId(w.id); }}
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
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selected ? "Modifier l'atelier" : "Nouvel atelier"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selected ? (
              <WorkshopForm
                mode="edit"
                workshop={selected}
                projectId={projectId}
                workshopTypes={workshopTypes}
                onSuccess={handleSheetClose}
                onCancel={handleSheetClose}
              />
            ) : (
              <WorkshopForm
                mode="create"
                projectId={projectId}
                workshopTypes={workshopTypes}
                onSuccess={handleSheetClose}
                onCancel={handleSheetClose}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) { setDeleteTargetId(null); setDeleteError(null); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet atelier ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;atelier sera désactivé. Cette action est réversible par un administrateur.
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
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
