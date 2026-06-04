"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createSessionGroup } from "./session.actions";

interface Workshop {
  id: string;
  nom: string;
  seancesCount: number;
  durationMin: number;
  typeId: string | null;
  typeNom: string | null;
}

interface RoleSlot {
  id: string;
  isOptional: boolean;
  ordre: number;
  couleur: string | null;
  metier: { nom: string };
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

type DateEntry = { startAt: string; endAt: string };

export function SessionForm({ workshops, getRoleGroups }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  // Step 2
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RoleGroup | null>(null);

  // Step 3
  const [checkedSlotIds, setCheckedSlotIds] = useState<Set<string>>(new Set());

  // Step 4
  const [nom, setNom] = useState("");
  const [notes, setNotes] = useState("");
  const [dates, setDates] = useState<DateEntry[]>([{ startAt: "", endAt: "" }]);

  const handleSelectWorkshop = (w: Workshop) => {
    setSelectedWorkshop(w);
    setSelectedGroup(null);
    setRoleGroups([]);
    setCheckedSlotIds(new Set());
  };

  const handleNextToStep2 = () => {
    if (!selectedWorkshop) return;
    if (!selectedWorkshop.typeId) {
      setStep(2);
      return;
    }
    setLoadingGroups(true);
    startTransition(async () => {
      try {
        const groups = await getRoleGroups(selectedWorkshop.typeId!);
        setRoleGroups(groups);
      } finally {
        setLoadingGroups(false);
      }
      setStep(2);
    });
  };

  const handleSelectGroup = (g: RoleGroup) => {
    setSelectedGroup(g);
    // Pré-cocher les slots requis
    const required = new Set(
      g.workshopRoleSlots.filter((s) => !s.isOptional).map((s) => s.id)
    );
    setCheckedSlotIds(required);
  };

  const toggleSlot = (slotId: string) => {
    setCheckedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  };

  const syncDatesCount = (count: number) => {
    setDates((prev) => {
      if (count === prev.length) return prev;
      if (count > prev.length) {
        return [...prev, ...Array(count - prev.length).fill({ startAt: "", endAt: "" })];
      }
      return prev.slice(0, count);
    });
  };

  const updateDate = (index: number, field: "startAt" | "endAt", value: string) => {
    setDates((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleSubmit = () => {
    if (!selectedWorkshop || !selectedGroup) return;
    if (!nom.trim()) { setError("Nom du groupe requis"); return; }
    const invalidDate = dates.some((d) => !d.startAt || !d.endAt);
    if (invalidDate) { setError("Toutes les dates doivent être renseignées"); return; }
    const checkedList = Array.from(checkedSlotIds);
    if (checkedList.length === 0) { setError("Au moins un rôle requis"); return; }

    setError(null);
    startTransition(async () => {
      const result = await createSessionGroup({
        workshopId: selectedWorkshop.id,
        workshopRoleGroupId: selectedGroup.id,
        checkedSlotIds: checkedList,
        nom: nom.trim(),
        notes: notes.trim() || undefined,
        dates: dates.map((d) => ({
          startAt: new Date(d.startAt).toISOString(),
          endAt: new Date(d.endAt).toISOString(),
        })),
      });
      if (result.ok) {
        router.push("/app");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {(["1", "2", "3", "4"] as const).map((s, i) => (
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
            {i < 3 && <span className="w-6 h-px bg-border" />}
          </span>
        ))}
      </div>

      {/* Step 1 — Workshop */}
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
                <div className="font-medium">{w.nom}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {w.typeNom && <span>{w.typeNom} · </span>}
                  {w.seancesCount} séance{w.seancesCount > 1 ? "s" : ""} · {w.durationMin} min
                </div>
              </button>
            ))}
          </div>
          <Button
            onClick={handleNextToStep2}
            disabled={!selectedWorkshop || loadingGroups || isPending}
          >
            {loadingGroups ? "Chargement…" : "Suivant"}
          </Button>
        </div>
      )}

      {/* Step 2 — Role group */}
      {step === 2 && selectedWorkshop && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Choisir la configuration de rôles</h2>
          {roleGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun groupe de rôles défini pour ce type d&apos;atelier.</p>
          ) : (
            <div className="space-y-2">
              {roleGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleSelectGroup(g)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    selectedGroup?.id === g.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="font-medium">{g.label}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {g.workshopRoleSlots.map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        style={s.couleur ? { borderColor: s.couleur, color: s.couleur } : undefined}
                        className="text-xs"
                      >
                        {s.metier.nom}
                        {s.isOptional && " (opt.)"}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedGroup && roleGroups.length > 0}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Slots */}
      {step === 3 && selectedGroup && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Rôles pour cette session</h2>
          <p className="text-sm text-muted-foreground">
            Les rôles requis sont pré-cochés. Décochez si inutile. Cochez les optionnels si besoin.
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
                    style={{ backgroundColor: slot.couleur ?? "#888" }}
                  />
                  {slot.metier.nom}
                  {slot.isOptional && (
                    <span className="text-xs text-muted-foreground">(optionnel)</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
            <Button onClick={() => setStep(4)} disabled={checkedSlotIds.size === 0}>
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Info + dates */}
      {step === 4 && selectedWorkshop && (
        <div className="space-y-6">
          <h2 className="text-base font-semibold">Informations et dates</h2>

          <div className="space-y-2">
            <Label htmlFor="nom">Nom du groupe / public</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex. Groupe parents — Session 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Séances ({dates.length} / {selectedWorkshop.seancesCount} prévues)
              </Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => syncDatesCount(dates.length - 1)}
                  disabled={dates.length <= 1}
                >
                  −
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => syncDatesCount(dates.length + 1)}
                  disabled={dates.length >= 20}
                >
                  +
                </Button>
              </div>
            </div>

            {dates.map((d, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Séance {i + 1}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Début</Label>
                    <Input
                      type="datetime-local"
                      value={d.startAt}
                      onChange={(e) => updateDate(i, "startAt", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fin</Label>
                    <Input
                      type="datetime-local"
                      value={d.endAt}
                      onChange={(e) => updateDate(i, "endAt", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>Retour</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Création…" : "Créer la session"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
