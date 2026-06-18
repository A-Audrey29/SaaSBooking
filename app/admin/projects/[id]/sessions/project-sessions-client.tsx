"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import type { ProjectSessionListItem } from "@/server/queries/session-group";

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-GP", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Guadeloupe",
  }).format(new Date(date));
}

type StatutsAgreges = ProjectSessionListItem["statutsAgreges"];

function statutLabel(statuts: StatutsAgreges): "À débloquer" | "En attente" | "Complet" | "Vide" {
  if (statuts.refused > 0) return "À débloquer";
  if (statuts.empty > 0 || statuts.pending > 0) return "En attente";
  if (statuts.confirmed > 0 || statuts.empty === 0) return "Complet";
  return "Vide";
}

function StatutBadge({ statuts }: { statuts: StatutsAgreges }) {
  const label = statutLabel(statuts);
  if (label === "À débloquer") return <Badge variant="destructive">À débloquer</Badge>;
  if (label === "En attente")
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">
        En attente
      </Badge>
    );
  if (label === "Complet")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        Complet
      </Badge>
    );
  return <Badge variant="outline">Vide</Badge>;
}

interface Props {
  sessions: ProjectSessionListItem[];
}

export function ProjectSessionsClient({ sessions }: Props) {
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterCentre, setFilterCentre] = useState<string>("all");
  const [filterAtelier, setFilterAtelier] = useState<string>("all");
  const [filterPrestataire, setFilterPrestataire] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const centres = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of sessions) seen.set(s.centreId, s.centreNom ?? s.centreId);
    return Array.from(seen.entries())
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [sessions]);

  const ateliers = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sessions) seen.add(s.workshopNom);
    return Array.from(seen).sort();
  }, [sessions]);

  const prestataires = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sessions) for (const p of s.providerNoms) seen.add(p);
    return Array.from(seen).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    const result = sessions.filter((s) => {
      if (filterCentre !== "all" && s.centreId !== filterCentre) return false;
      if (filterAtelier !== "all" && s.workshopNom !== filterAtelier) return false;
      if (filterPrestataire !== "all" && !s.providerNoms.includes(filterPrestataire)) return false;
      if (filterStatut !== "all" && statutLabel(s.statutsAgreges) !== filterStatut) return false;
      return true;
    });
    result.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? diff : -diff;
    });
    return result;
  }, [sessions, filterCentre, filterAtelier, filterPrestataire, filterStatut, sortAsc]);

  const hasFilters =
    filterStatut !== "all" ||
    filterCentre !== "all" ||
    filterAtelier !== "all" ||
    filterPrestataire !== "all";

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">Aucune séance pour ce projet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Statut</span>
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="À débloquer">À débloquer</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="Complet">Complet</SelectItem>
              <SelectItem value="Vide">Vide</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {centres.length > 1 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Centre</span>
            <Select value={filterCentre} onValueChange={setFilterCentre}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="Tous les centres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les centres</SelectItem>
                {centres.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        {prestataires.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Prestataire</span>
            <Select value={filterPrestataire} onValueChange={setFilterPrestataire}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {prestataires.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasFilters && (
          <button
            onClick={() => {
              setFilterStatut("all");
              setFilterCentre("all");
              setFilterAtelier("all");
              setFilterPrestataire("all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline self-end pb-1.5"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">Aucune séance ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Séance</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Centre</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Atelier</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Prestataire(s)</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                  <button
                    onClick={() => setSortAsc((v) => !v)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Créée le
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{s.nom}</span>
                    {(s.sessionNumber != null || s.seanceNumber != null) && (
                      <span className="text-xs text-muted-foreground block">
                        {s.sessionNumber != null && `Session #${s.sessionNumber}`}
                        {s.sessionNumber != null && s.seanceNumber != null && " · "}
                        {s.seanceNumber != null && `Séance ${s.seanceNumber}`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.centreNom}</td>
                  <td className="px-4 py-3">
                    <span>{s.workshopNom}</span>
                    {s.typeNom && (
                      <span className="text-xs text-muted-foreground block">{s.typeNom}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.providerNoms.length > 0 ? s.providerNoms.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatutBadge statuts={s.statutsAgreges} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
