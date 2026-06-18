"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SessionGroupListItem } from "@/server/queries/session-group";

function formatDate(date: Date | null): string {
  if (!date) return "Aucune séance planifiée";
  return new Intl.DateTimeFormat("fr-GP", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guadeloupe",
  }).format(new Date(date));
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-GP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guadeloupe",
  }).format(new Date(date));
}

function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-GP", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Guadeloupe",
  }).format(new Date(date));
}

type StatutKey = "a-debloquer" | "en-attente" | "complet" | "vide";

function getStatutKey(statuts: SessionGroupListItem["statutsAgreges"]): StatutKey {
  if (statuts.refused > 0) return "a-debloquer";
  if (statuts.empty > 0 || statuts.pending > 0) return "en-attente";
  if (statuts.confirmed > 0 || statuts.empty === 0) return "complet";
  return "vide";
}

function StatutBadge({ statuts }: { statuts: SessionGroupListItem["statutsAgreges"] }) {
  const key = getStatutKey(statuts);
  if (key === "a-debloquer") return <Badge variant="destructive">À débloquer</Badge>;
  if (key === "en-attente") return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">En attente</Badge>;
  if (key === "complet") return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Complet</Badge>;
  return <Badge variant="outline">Vide</Badge>;
}

interface Props {
  sessions: SessionGroupListItem[];
}

type SortBy = "date-prochaine" | "date-creation" | "nom-atelier";
type FilterStatut = "all" | StatutKey;

export function SessionsListClient({ sessions }: Props) {
  const [filterAtelier, setFilterAtelier] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<FilterStatut>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date-prochaine");

  const ateliers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of sessions) seen.set(s.workshopNom, s.workshopNom);
    return Array.from(seen.values()).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    const result = sessions.filter((s) => {
      if (filterAtelier !== "all" && s.workshopNom !== filterAtelier) return false;
      if (filterStatut !== "all" && getStatutKey(s.statutsAgreges) !== filterStatut) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === "date-prochaine") {
        if (!a.prochaineDateAt && !b.prochaineDateAt) return 0;
        if (!a.prochaineDateAt) return 1;
        if (!b.prochaineDateAt) return -1;
        return new Date(a.prochaineDateAt as Date).getTime() - new Date(b.prochaineDateAt as Date).getTime();
      }
      if (sortBy === "date-creation") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // nom-atelier
      return a.workshopNom.localeCompare(b.workshopNom, "fr");
    });
  }, [sessions, filterAtelier, filterStatut, sortBy]);

  // Regroupement hiérarchique : atelier → session → séances
  const grouped = useMemo(() => {
    const byAtelier = new Map<string, Map<number | null, SessionGroupListItem[]>>();
    for (const s of filtered) {
      if (!byAtelier.has(s.workshopNom)) byAtelier.set(s.workshopNom, new Map());
      const bySession = byAtelier.get(s.workshopNom)!;
      const key = s.sessionNumber ?? null;
      if (!bySession.has(key)) bySession.set(key, []);
      bySession.get(key)!.push(s);
    }
    return byAtelier;
  }, [filtered]);

  const hasFilters = filterAtelier !== "all" || filterStatut !== "all" || sortBy !== "date-prochaine";

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Aucune séance créée — commencez par créer une nouvelle séance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Atelier</span>
          <Select value={filterAtelier} onValueChange={setFilterAtelier}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="Tous les ateliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les ateliers</SelectItem>
              {ateliers.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Statut</span>
          <Select value={filterStatut} onValueChange={(v) => setFilterStatut(v as FilterStatut)}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="a-debloquer">À débloquer</SelectItem>
              <SelectItem value="en-attente">En attente</SelectItem>
              <SelectItem value="complet">Complet</SelectItem>
              <SelectItem value="vide">Vide</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Trier par</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-prochaine">Prochaine séance</SelectItem>
              <SelectItem value="date-creation">Date de création</SelectItem>
              <SelectItem value="nom-atelier">Nom atelier (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setFilterAtelier("all");
              setFilterStatut("all");
              setSortBy("date-prochaine");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline self-end pb-1.5"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste groupée */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">Aucune séance ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([atelierNom, bySession]) => (
            <div key={atelierNom}>
              {/* Header atelier — masqué si filtre atelier actif */}
              {filterAtelier === "all" && (
                <div className="mb-4">
                  <h2 className="text-base font-semibold tracking-tight mb-2">{atelierNom}</h2>
                  <div className="h-px bg-border" />
                </div>
              )}

              <div className="space-y-5">
                {Array.from(bySession.entries()).map(([sessionNum, seances]) => (
                  <div key={sessionNum ?? "sans-session"}>
                    {/* Header session */}
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 ml-1">
                      {sessionNum != null ? `Session #${sessionNum}` : "Sans numéro de session"}
                    </p>

                    <div className="space-y-2">
                      {seances.map((s) => (
                        <Link
                          key={s.id}
                          href={`/app/sessions/${s.id}`}
                          className="block rounded-lg border bg-card hover:border-primary/40 transition-colors px-5 py-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="font-medium truncate flex items-baseline gap-2">
                                <span>{s.nom}</span>
                                {s.seanceNumber != null && (
                                  <span className="text-xs text-muted-foreground font-normal shrink-0">
                                    Séance {s.seanceNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Créée le {formatDateShort(s.createdAt)} · Séance prévue le : {formatDate(s.prochaineDateAt as Date | null)}
                                {(() => { const end = formatTime(s.prochaineDateEndAt as Date | null); return end ? ` → ${end}` : null; })()}
                              </div>
                            </div>
                            <div className="flex-shrink-0 pt-0.5">
                              <StatutBadge statuts={s.statutsAgreges} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
