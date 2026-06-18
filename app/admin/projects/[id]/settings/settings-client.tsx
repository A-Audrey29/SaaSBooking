"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/app/admin/projects/project-form";
import { softDeleteProject } from "@/app/admin/projects/projects.actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

interface Props {
  project: ProjectRow;
  centres: Centre[];
}

export function ProjectSettingsClient({ project, centres }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await softDeleteProject({ id: project.id });
      if (result.ok) {
        router.push("/admin/projects");
      } else {
        console.error("Erreur suppression:", result.error);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-xl">
      <section>
        <h2 className="text-base font-semibold mb-4">Modifier le projet</h2>
        <ProjectForm
          mode="edit"
          project={project}
          centres={centres}
          onSuccess={() => router.refresh()}
          onCancel={() => router.back()}
        />
      </section>

      <Separator />

      <section>
        <h2 className="text-base font-semibold text-destructive mb-2">Zone dangereuse</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Supprimer ce projet le désactive. Les ateliers et affectations existants ne sont pas supprimés.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={isPending}>
          Supprimer le projet
        </Button>
      </section>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le projet sera désactivé. Cette action est réversible par un administrateur.
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
