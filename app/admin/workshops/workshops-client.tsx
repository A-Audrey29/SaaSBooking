"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WorkshopTypeForm } from "./workshop-type-form";
import { RoleGroupForm } from "./role-group-form";
import { RoleSlotForm } from "./role-slot-form";
import { WorkshopQuickCreateDrawer } from "./workshop-quick-create-drawer";
import {
  softDeleteWorkshopType,
  softDeleteRoleGroup,
  softDeleteRoleSlot,
} from "./workshops.actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type RoleSlot = {
  id: string;
  metierId: string;
  metier: { id: string; nom: string; color: string | null };
  isOptional: boolean;
  ordre: number;
};

type RoleGroup = {
  id: string;
  label: string;
  ordre: number;
  workshopRoleSlots: RoleSlot[];
};

type WorkshopType = {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  centreId: string | null;
  centre: { id: string; nom: string } | null;
  workshopRoleGroups: RoleGroup[];
};

type Centre = { id: string; nom: string };
type Metier = { id: string; nom: string };

interface WorkshopsClientProps {
  workshopTypes: WorkshopType[];
  centres: Centre[];
  metiers: Metier[];
}

// ─── Sheet / Delete state ────────────────────────────────────────────────────

type SheetMode =
  | { kind: "create-type" }
  | { kind: "edit-type"; type: WorkshopType }
  | { kind: "create-group"; workshopTypeId: string }
  | { kind: "edit-group"; group: RoleGroup; workshopTypeId: string }
  | { kind: "create-slot"; workshopRoleGroupId: string }
  | { kind: "edit-slot"; slot: RoleSlot; workshopRoleGroupId: string };

type DeleteTarget =
  | { kind: "type"; id: string; label: string }
  | { kind: "group"; id: string; label: string }
  | { kind: "slot"; id: string; label: string };

export function WorkshopsClient({ workshopTypes, centres, metiers }: WorkshopsClientProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleType = (id: string) =>
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      let result: { ok: boolean; error?: string };
      if (deleteTarget.kind === "type") {
        result = await softDeleteWorkshopType({ id: deleteTarget.id });
      } else if (deleteTarget.kind === "group") {
        result = await softDeleteRoleGroup({ id: deleteTarget.id });
      } else {
        result = await softDeleteRoleSlot({ id: deleteTarget.id });
      }
      if (result.ok) {
        setDeleteTarget(null);
      } else {
        setDeleteError(result.error ?? "Erreur inconnue");
      }
    });
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h-2xl font-semibold tracking-tight">Types d'ateliers</h1>
        <Button onClick={() => setQuickCreateOpen(true)}>
          + Nouvel atelier
        </Button>
      </div>

      <div className="space-y-3">
        {workshopTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun type d'atelier.</p>
        )}

        {workshopTypes.map((wt) => (
          <div key={wt.id} className="border rounded-lg">
            {/* Type header */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                className="flex items-center gap-3 text-left flex-1"
                onClick={() => toggleType(wt.id)}
              >
                <span className="text-muted-foreground text-xs">
                  {expandedTypes.has(wt.id) ? "▼" : "▶"}
                </span>
                <span className="font-medium">{wt.nom}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {wt.code}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {wt.centre ? wt.centre.nom : "Global"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {wt.workshopRoleGroups.length} groupe(s)
                </span>
              </button>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSheetMode({ kind: "edit-type", type: wt })}
                >
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDeleteTarget({ kind: "type", id: wt.id, label: wt.nom })
                  }
                >
                  Supprimer
                </Button>
              </div>
            </div>

            {/* Groups (expanded) */}
            {expandedTypes.has(wt.id) && (
              <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                {wt.workshopRoleGroups.map((g) => (
                  <div key={g.id} className="border rounded-md bg-background">
                    {/* Group header */}
                    <div className="flex items-center justify-between px-3 py-2">
                      <button
                        className="flex items-center gap-2 text-left flex-1"
                        onClick={() => toggleGroup(g.id)}
                      >
                        <span className="text-muted-foreground text-xs">
                          {expandedGroups.has(g.id) ? "▼" : "▶"}
                        </span>
                        <span className="font-medium text-sm">{g.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {g.workshopRoleSlots.length} slot(s)
                        </span>
                      </button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSheetMode({
                              kind: "edit-group",
                              group: g,
                              workshopTypeId: wt.id,
                            })
                          }
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({ kind: "group", id: g.id, label: g.label })
                          }
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>

                    {/* Slots (expanded) */}
                    {expandedGroups.has(g.id) && (
                      <div className="border-t px-3 py-2 space-y-1">
                        {g.workshopRoleSlots.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between py-1"
                          >
                            <div className="flex items-center gap-2">
                              {s.metier.color && (
                                <span
                                  className="inline-block w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: s.metier.color }}
                                />
                              )}
                              <span className="text-sm">{s.metier.nom}</span>
                              {s.isOptional && (
                                <Badge variant="secondary" className="text-xs">
                                  Optionnel
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSheetMode({
                                    kind: "edit-slot",
                                    slot: s,
                                    workshopRoleGroupId: g.id,
                                  })
                                }
                              >
                                Modifier
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDeleteTarget({ kind: "slot", id: s.id, label: s.metier.nom })
                                }
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            setSheetMode({ kind: "create-slot", workshopRoleGroupId: g.id })
                          }
                        >
                          + Ajouter un slot
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSheetMode({ kind: "create-group", workshopTypeId: wt.id })
                  }
                >
                  + Ajouter un groupe
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick create drawer */}
      <WorkshopQuickCreateDrawer
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        centres={centres}
        metiers={metiers}
      />

      {/* Advanced sheet */}
      <Sheet open={sheetMode !== null} onOpenChange={(o) => !o && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {sheetMode?.kind === "create-type" && "Nouveau type d'atelier"}
              {sheetMode?.kind === "edit-type" && "Modifier le type"}
              {sheetMode?.kind === "create-group" && "Nouveau groupe"}
              {sheetMode?.kind === "edit-group" && "Modifier le groupe"}
              {sheetMode?.kind === "create-slot" && "Nouveau slot"}
              {sheetMode?.kind === "edit-slot" && "Modifier le slot"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {(sheetMode?.kind === "create-type" || sheetMode?.kind === "edit-type") && (
              <WorkshopTypeForm
                centres={centres}
                defaultValues={
                  sheetMode.kind === "edit-type"
                    ? {
                        id: sheetMode.type.id,
                        centreId: sheetMode.type.centreId,
                        code: sheetMode.type.code,
                        nom: sheetMode.type.nom,
                        description: sheetMode.type.description ?? undefined,
                      }
                    : undefined
                }
                onSuccess={() => setSheetMode(null)}
                onCancel={() => setSheetMode(null)}
              />
            )}
            {(sheetMode?.kind === "create-group" || sheetMode?.kind === "edit-group") && (
              <RoleGroupForm
                workshopTypeId={sheetMode.workshopTypeId}
                defaultValues={
                  sheetMode.kind === "edit-group"
                    ? {
                        id: sheetMode.group.id,
                        label: sheetMode.group.label,
                        ordre: sheetMode.group.ordre,
                      }
                    : undefined
                }
                onSuccess={() => setSheetMode(null)}
                onCancel={() => setSheetMode(null)}
              />
            )}
            {(sheetMode?.kind === "create-slot" || sheetMode?.kind === "edit-slot") && (
              <RoleSlotForm
                workshopRoleGroupId={sheetMode.workshopRoleGroupId}
                metiers={metiers}
                defaultValues={
                  sheetMode.kind === "edit-slot"
                    ? {
                        id: sheetMode.slot.id,
                        metierId: sheetMode.slot.metierId,
                        isOptional: sheetMode.slot.isOptional,
                        ordre: sheetMode.slot.ordre,
                      }
                    : undefined
                }
                onSuccess={() => setSheetMode(null)}
                onCancel={() => setSheetMode(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer <strong>{deleteTarget?.label}</strong> ? Cette action est réversible (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
