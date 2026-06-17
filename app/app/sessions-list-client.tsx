"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

function StatutBadge({ statuts }: { statuts: SessionGroupListItem["statutsAgreges"] }) {
  if (statuts.refused > 0) {
    return <Badge variant="destructive">À débloquer</Badge>;
  }
  if (statuts.empty > 0 || statuts.pending > 0) {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">
        En attente
      </Badge>
    );
  }
  if (statuts.confirmed > 0 || statuts.empty === 0) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        Complet
      </Badge>
    );
  }
  return <Badge variant="outline">Vide</Badge>;
}

interface Props {
  sessions: SessionGroupListItem[];
}

export function SessionsListClient({ sessions }: Props) {
  const [filterAtelier, setFilterAtelier] = useState<string>("all");
  const [filterSession, setFilterSession] = useState<string>("");
  const [filterSeance, setFilterSeance] = useState<string>("");

  const ateliers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of sessions) seen.set(s.workshopNom, s.workshopNom);
    return Array.from(seen.values()).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterAtelier !== "all" && s.workshopNom !== filterAtelier) return false;
      if (filterSession !== "") {
        const n = parseInt(filterSession);
        if (!isNaN(n) && s.sessionNumber !== n) return false;
      }
      if (filterSeance !== "") {
        const n = parseInt(filterSeance);
        if (!isNaN(n) && s.seanceNumber !== n) return false;
      }
      return true;
    });
  }, [sessions, filterAtelier, filterSession, filterSeance]);

  const hasFilters = filterAtelier !== "all" || filterSession !== "" || filterSeance !== "";

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
          <span className="text-xs text-muted-foreground">N° session</span>
          <Input
            type="number"
            min={1}
            placeholder="ex. 3"
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="w-24 h-8 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">N° séance</span>
          <Input
            type="number"
            min={1}
            placeholder="ex. 2"
            value={filterSeance}
            onChange={(e) => setFilterSeance(e.target.value)}
            className="w-24 h-8 text-sm"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setFilterAtelier("all");
              setFilterSession("");
              setFilterSeance("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline self-end pb-1.5"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">Aucune séance ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/app/sessions/${s.id}`}
              className="block rounded-lg border bg-card hover:border-primary/40 transition-colors px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="font-medium truncate flex items-baseline gap-2">
                    <span>{s.nom}</span>
                    {(s.sessionNumber != null || s.seanceNumber != null) && (
                      <span className="text-xs text-muted-foreground font-normal shrink-0">
                        {s.sessionNumber != null && `Session #${s.sessionNumber}`}
                        {s.sessionNumber != null && s.seanceNumber != null && " · "}
                        {s.seanceNumber != null && `Séance ${s.seanceNumber}`}
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
      )}
    </div>
  );
}
