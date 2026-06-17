"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createSessionGroup } from "./session.actions";

interface Workshop {
  id: string;
  nom: string;
  seancesCount: number;
  durationMin: number;
  typeId: string | null;
  typeNom: string | null;
  defaultRoles: { nom: string; isOptional: boolean; color: string | null }[];
}

interface RoleSlot {
  id: string;
  isOptional: boolean;
  ordre: number;
  metier: { nom: string; color: string | null };
}

interface RoleGroup {
  id: string;
  label: string;
  ordre: number;
  workshopRoleSlots: RoleSlot[];
}

interface Props {
  workshops: Workshop[];
  getRoleGroups: (workshopTypeId: string) => Promise<RoleGroup[]>;
}

// Wizard à 3 étapes :
// 1 — Atelier + configuration de rôles (fusionnés)
// 2 — Rôles à activer pour cette séance
// 3 — Informations (nom, numéro session, nb séances, notes)
export function SessionForm({ workshops, getRoleGroups }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RoleGroup | null>(null);

  // Step 2
  const [checkedSlotIds, setCheckedSlotIds] = useState<Set<string>>(new Set());

  // Step 3
  const [nom, setNom] = useState("");
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [seanceNumber, setSeanceNumber] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const handleSelectWorkshop = (w: Workshop) => {
    setSelectedWorkshop(w);
    setSelectedGroup(null);
    setRoleGroups([]);
    setCheckedSlotIds(new Set());

    if (!w.typeId) return;

    setLoadingGroups(true);
    startTransition(async () => {
      try {
        const groups = await getRoleGroups(w.typeId!);
        setRoleGroups(groups);
      } finally {
        setLoadingGroups(false);
      }
    });
  };

  const toggleSlot = (slotId: string) => {
    setCheckedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const handleNextToStep2 = () => {
    if (!selectedWorkshop) return;
    // Pré-cocher les slots requis du groupe sélectionné (ou du premier groupe chargé)
    const group = selectedGroup ?? roleGroups[0] ?? null;
    if (group) {
      setSelectedGroup(group);
      const required = new Set(
        group.workshopRoleSlots.filter((s) => !s.isOptional).map((s) => s.id)
      );
      setCheckedSlotIds(required);
    }
    setStep(2);
  };

  const handleNextToStep3 = () => {
    if (checkedSlotIds.size === 0) { setError("Au moins un rôle requis"); return; }
    setError(null);
    // Pré-remplir le nom avec le nom de l'atelier sélectionné
    if (!nom && selectedWorkshop) setNom(selectedWorkshop.nom);
    // Réinitialiser le numéro de séance à 1 pour chaque nouvelle séance
    setSeanceNumber(1);
    setStep(3);
  };

  const handleSubmit = () => {
    if (!selectedWorkshop || !selectedGroup) return;
    if (!nom.trim()) { setError("Nom du groupe requis"); return; }
    const checkedList = Array.from(checkedSlotIds);
    if (checkedList.length === 0) { setError("Au moins un rôle requis"); return; }

    // Noms des métiers cochés pour filtrer le calendrier disponibilités
    const metierNoms = selectedGroup.workshopRoleSlots
      .filter((s) => checkedSlotIds.has(s.id))
      .map((s) => s.metier.nom);

    setError(null);
    startTransition(async () => {
      const result = await createSessionGroup({
        workshopId: selectedWorkshop.id,
        workshopRoleGroupId: selectedGroup.id,
        checkedSlotIds: checkedList,
        nom: nom.trim(),
        sessionNumber,
        seanceNumber,
        notes: notes.trim() || undefined,
      });
      if (result.ok) {
        const p = new URLSearchParams();
        if (metierNoms.length > 0) p.set("metiers", metierNoms.join(","));
        p.set("sessionGroupId", result.id);
        router.push(`/app/availability?${p.toString()}`);
      } else {
        setError(result.error);
      }
    });
  };

  const canProceedStep1 = !!selectedWorkshop && !loadingGroups && !isPending;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {(["1", "2", "3"] as const).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                Number(s) === step
                  ? "bg-primary text-primary-foreground"
                  : Number(s) < step
                  ? "bg-muted-foreground/30 text-muted-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </span>
            {i < 2 && <span className="w-6 h-px bg-border" />}
          </span>
        ))}
      </div>

      {/* ── Step 1 — Sélectionner un atelier ── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Sélectionner un atelier</h2>

          <div className="space-y-2">
            {workshops.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSelectWorkshop(w)}
                className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                  selectedWorkshop?.id === w.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Infos atelier */}
                  <div>
                    <div className="font-medium">{w.nom}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {w.typeNom && <span>{w.typeNom} · </span>}
                      {w.seancesCount} séance{w.seancesCount > 1 ? "s" : ""} · {w.durationMin} min
                    </div>
                  </div>

                  {/* Prestataires requis */}
                  {w.defaultRoles.length > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground mb-1">Prestataire(s)</div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {w.defaultRoles.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                            style={r.color ? { borderColor: r.color, color: r.color } : undefined}
                          >
                            {r.nom}
                            {r.isOptional && <span className="opacity-60">(opt.)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <Button onClick={handleNextToStep2} disabled={!canProceedStep1}>
            {loadingGroups ? "Chargement…" : "Suivant"}
          </Button>
        </div>
      )}

      {/* ── Step 2 — Rôles pour cette séance ── */}
      {step === 2 && selectedGroup && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Rôles pour cette séance</h2>
          <p className="text-sm text-muted-foreground">
            Les rôles requis sont pré-cochés. Décochez si inutile. Gardez coché si besoin du prestataire.
          </p>
          <div className="space-y-3">
            {selectedGroup.workshopRoleSlots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-3">
                <Checkbox
                  id={slot.id}
                  checked={checkedSlotIds.has(slot.id)}
                  onCheckedChange={() => toggleSlot(slot.id)}
                />
                <Label htmlFor={slot.id} className="flex items-center gap-2 cursor-pointer">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: slot.metier.color ?? "#888" }}
                  />
                  {slot.metier.nom}
                  {slot.isOptional && (
                    <span className="text-xs text-muted-foreground">(optionnel)</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
            <Button onClick={handleNextToStep3} disabled={checkedSlotIds.size === 0}>
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 — Informations ── */}
      {step === 3 && selectedWorkshop && selectedGroup && (
        <div className="space-y-6">
          <h2 className="text-base font-semibold">Informations</h2>

          {/* Récapitulatif des métiers retenus */}
          <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Métiers retenus</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {selectedGroup.workshopRoleSlots
                .filter((s) => checkedSlotIds.has(s.id))
                .map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium"
                    style={s.metier.color ? { borderColor: s.metier.color, color: s.metier.color } : undefined}
                  >
                    {s.metier.nom}
                  </span>
                ))}
            </div>
          </div>

          {/* Nom de l'atelier pré-rempli */}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom de l&apos;atelier / public</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex. Groupe parents"
            />
          </div>

          {/* Numéro de session */}
          <div className="space-y-2">
            <Label htmlFor="sessionNumber">Numéro de la session</Label>
            <Input
              id="sessionNumber"
              type="number"
              min={1}
              max={999}
              value={sessionNumber}
              onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-32"
            />
          </div>

          {/* Numéro de la séance */}
          <div className="space-y-2">
            <Label htmlFor="seanceNumber">Numéro de la séance</Label>
            <Input
              id="seanceNumber"
              type="number"
              min={1}
              max={999}
              value={seanceNumber}
              onChange={(e) => setSeanceNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Sur {selectedWorkshop.seancesCount} séance{selectedWorkshop.seancesCount > 1 ? "s" : ""} prévues pour cet atelier.
            </p>
          </div>

          {/* Compteur séances et liste désactivés — les dates seront fixées via le calendrier des dispos prestataires
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Séances ({seanceCount} / {selectedWorkshop.seancesCount} prévues)</Label>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setSeanceCount((n) => Math.max(1, n - 1))} disabled={seanceCount <= 1}>−</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setSeanceCount((n) => Math.min(20, n + 1))} disabled={seanceCount >= 20}>+</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Les dates seront fixées lors du choix des disponibilités prestataires.</p>
            <div className="space-y-1">
              {Array.from({ length: seanceCount }, (_, i) => (
                <div key={i} className="rounded-md border px-3 py-2 text-sm text-muted-foreground">Séance {i + 1} — date à fixer</div>
              ))}
            </div>
          </div>
          */}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Création…" : "Créer la séance"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
