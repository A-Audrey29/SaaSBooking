"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { ProviderForm } from "./provider-form";
import { softDeleteProvider } from "./providers.actions";

interface Metier {
  id: string;
  nom: string;
}

interface Provider {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  ville: string | null;
  metierId: string | null;
  metierNom: string | null;
  bio: string | null;
  createdAt: Date;
}

interface ProvidersClientProps {
  providers: Provider[];
  metiers: Metier[];
}

export function ProvidersClient({ providers, metiers }: ProvidersClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedProvider(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      const result = await softDeleteProvider({ id: deleteTargetId });
      if (!result.ok) {
        console.error("Erreur suppression:", result.error);
      }
      setDeleteTargetId(null);
    });
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Prestataires</h1>
        <Button asChild>
          <Link href="/admin/users">Inviter un prestataire</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Métier</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  <p>Aucun prestataire trouvé</p>
                  <p className="text-sm mt-1">
                    Créez d&apos;abord un utilisateur avec le rôle &quot;Prestataire&quot; depuis la page{" "}
                    <Link href="/admin/users" className="underline underline-offset-2">
                      Utilisateurs
                    </Link>
                    .
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.nom}</TableCell>
                  <TableCell>{provider.email}</TableCell>
                  <TableCell>{provider.metierNom ?? "—"}</TableCell>
                  <TableCell>{provider.ville ?? "—"}</TableCell>
                  <TableCell>{provider.telephone ?? "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(provider)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(provider.id)}
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
            <SheetTitle>Modifier le prestataire</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedProvider && (
              <ProviderForm
                mode="edit"
                provider={selectedProvider}
                metiers={metiers}
                onSuccess={handleSheetClose}
                onCancel={handleSheetClose}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce prestataire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le prestataire sera désactivé. Cette action est réversible par un administrateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
