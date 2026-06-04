"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Aucune session créée — commencez par créer une nouvelle séance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <Link
          key={s.id}
          href={`/app/sessions/${s.id}`}
          className="block rounded-lg border bg-card hover:border-primary/40 transition-colors px-5 py-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="font-medium truncate">{s.nom}</div>
              <div className="text-sm text-muted-foreground">
                {s.workshopNom}
                {s.typeNom && <span> · {s.typeNom}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {s.occurrencesCount} séance{s.occurrencesCount !== 1 ? "s" : ""} · Prochaine :{" "}
                {formatDate(s.prochaineDateAt as Date | null)}
              </div>
            </div>
            <div className="flex-shrink-0 pt-0.5">
              <StatutBadge statuts={s.statutsAgreges} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
