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
import { CentreForm } from "./centre-form";
import { softDeleteCentre } from "./centres.actions";

interface Centre {
  id: string;
  nom: string;
  ville: string;
  adresse: string | null;
  timezone: string;
  telephone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CentersClientProps {
  centres: Centre[];
}

export function CentersClient({ centres }: CentersClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setSelectedCentre(null);
    setSheetOpen(true);
  };

  const handleEdit = (centre: Centre) => {
    setSelectedCentre(centre);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedCentre(null);
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmId === id) {
      // Second click - confirm delete
      startTransition(async () => {
        try {
          await softDeleteCentre(id);
          setDeleteConfirmId(null);
        } catch (error) {
          console.error("Delete failed:", error);
        }
      });
    } else {
      // First click - show confirm
      setDeleteConfirmId(id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h-2xl font-semibold tracking-tight">Centres</h1>
        <Button onClick={handleCreate}>+ Nouveau centre</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centres.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun centre trouvé
                </TableCell>
              </TableRow>
            ) : (
              centres.map((centre) => (
                <TableRow key={centre.id}>
                  <TableCell className="font-medium">{centre.nom}</TableCell>
                  <TableCell>{centre.ville}</TableCell>
                  <TableCell>{centre.telephone || "—"}</TableCell>
                  <TableCell>{centre.email || "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(centre)}
                    >
                      Modifier
                    </Button>
                    {deleteConfirmId === centre.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(centre.id)}
                          disabled={isPending}
                        >
                          Confirmer ?
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelDelete}
                          disabled={isPending}
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(centre.id)}
                        disabled={isPending}
                      >
                        Supprimer
                      </Button>
                    )}
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
              {selectedCentre ? "Modifier le centre" : "Nouveau centre"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CentreForm
              defaultValues={
                selectedCentre
                  ? {
                      id: selectedCentre.id,
                      nom: selectedCentre.nom,
                      ville: selectedCentre.ville,
                      adresse: selectedCentre.adresse ?? undefined,
                      timezone: selectedCentre.timezone,
                      telephone: selectedCentre.telephone ?? undefined,
                      email: selectedCentre.email ?? undefined,
                    }
                  : undefined
              }
              onSuccess={handleSheetClose}
              onCancel={handleSheetClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
