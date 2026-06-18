"use client";

import Link from "next/link";
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
import { ProjectForm } from "./project-form";
import { softDeleteProject } from "./projects.actions";

interface ProjectCentre {
  id: string;
  nom: string;
}

interface Project {
  id: string;
  centres: ProjectCentre[];
  nom: string;
  description: string | null;
  financeur: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: Date;
}

interface Centre {
  id: string;
  nom: string;
}

interface ProjectsClientProps {
  projects: Project[];
  centres: Centre[];
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export function ProjectsClient({ projects, centres }: ProjectsClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setSelectedProject(null);
    setSheetOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      const result = await softDeleteProject({ id: deleteTargetId });
      if (!result.ok) {
        console.error("Erreur suppression:", result.error);
      }
      setDeleteTargetId(null);
    });
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h-2xl font-semibold tracking-tight">Projets</h1>
        <Button onClick={handleCreate}>+ Nouveau projet</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Centres</TableHead>
              <TableHead>Financeur</TableHead>
              <TableHead>Période</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun projet trouvé
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="hover:underline focus-visible:underline outline-none"
                    >
                      {project.nom}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {project.centres.length === 0 ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        project.centres.map((c) => (
                          <Badge key={c.id} variant="outline">
                            {c.nom}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{project.financeur ?? "—"}</TableCell>
                  <TableCell>
                    {project.startDate || project.endDate
                      ? `${formatDate(project.startDate)} → ${formatDate(project.endDate)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(project)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(project.id)}
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
              {selectedProject ? "Modifier le projet" : "Nouveau projet"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedProject ? (
              <ProjectForm
                mode="edit"
                project={selectedProject}
                centres={centres}
                onSuccess={handleSheetClose}
                onCancel={handleSheetClose}
              />
            ) : (
              <ProjectForm
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
