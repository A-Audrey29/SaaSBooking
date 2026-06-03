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
import { UserForm } from "./user-form";
import { softDeleteUser, resendInvitation } from "./users.actions";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  centreId: string | null;
  centreNom: string | null;
  passwordSet: boolean | null;
  createdAt: Date;
}

interface Centre {
  id: string;
  nom: string;
}

interface UsersClientProps {
  users: User[];
  centres: Centre[];
}

export function UsersClient({ users, centres }: UsersClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setSelectedUser(null);
    setSheetOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedUser(null);
  };

  const handleResend = (id: string) => {
    startTransition(async () => {
      const result = await resendInvitation({ id });
      if (result.ok) {
        // TODO: replace with sonner toast when installed
        console.log(
          result.emailSent
            ? "Invitation renvoyée"
            : "Invitation créée — email non envoyé (dev)"
        );
      } else {
        // TODO: replace with sonner toast when installed
        console.error("Erreur:", result.error);
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      const result = await softDeleteUser({ id: deleteTargetId });
      if (!result.ok) {
        // TODO: replace with sonner toast when installed
        console.error("Erreur suppression:", result.error);
      }
      setDeleteTargetId(null);
    });
  };

  const roleLabel: Record<string, string> = {
    super_admin: "Super admin",
    project_admin: "Admin projet",
    referent: "Référent",
    provider: "Prestataire",
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h-2xl font-semibold tracking-tight">Utilisateurs</h1>
        <Button onClick={handleCreate}>+ Inviter un utilisateur</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Centre</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name ?? "—"}</TableCell>
                  <TableCell>{roleLabel[user.role] ?? user.role}</TableCell>
                  <TableCell>{user.centreNom ?? "—"}</TableCell>
                  <TableCell>
                    {user.passwordSet ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Invitation envoyée
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      Modifier
                    </Button>
                    {!user.passwordSet && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(user.id)}
                        disabled={isPending}
                      >
                        Renvoyer
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(user.id)}
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
              {selectedUser ? "Modifier l'utilisateur" : "Inviter un utilisateur"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedUser ? (
              <UserForm
                mode="edit"
                user={selectedUser}
                centres={centres}
                onSuccess={handleSheetClose}
                onCancel={handleSheetClose}
              />
            ) : (
              <UserForm
                mode="create"
                centres={centres}
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
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'utilisateur sera désactivé. Cette action est réversible par un administrateur.
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
