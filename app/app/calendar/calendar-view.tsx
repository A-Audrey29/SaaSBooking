"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OccurrenceCalendarRow } from "@/server/queries/calendar";

const STATUT_LABELS: Record<string, string> = {
  planned: "Planifiée",
  confirmed: "Confirmée",
  completed: "Réalisée",
  cancelled: "Annulée",
};

const STATUT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planned: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday = start
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function endOfWeek(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function addWeeks(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n * 7);
  return copy;
}

function formatWeekLabel(monday: Date): string {
  const sunday = endOfWeek(monday);
  return `${monday.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
}

function groupByDay(occurrences: OccurrenceCalendarRow[], monday: Date) {
  const days: { label: string; date: Date; items: OccurrenceCalendarRow[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const label = day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
    const items = occurrences.filter((o) => {
      const d = new Date(o.startAt);
      return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
    });
    days.push({ label, date: day, items });
  }
  return days;
}

interface Props {
  occurrences: OccurrenceCalendarRow[];
}

export function CalendarView({ occurrences }: Props) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const days = groupByDay(occurrences, weekStart);

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addWeeks(w, -1))}>
          ← Semaine précédente
        </Button>
        <span className="text-sm font-medium">{formatWeekLabel(weekStart)}</span>
        <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
          Semaine suivante →
        </Button>
      </div>

      {/* Days */}
      <div className="space-y-3">
        {days.map((day) => (
          <div key={day.date.toISOString()}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 capitalize">
              {day.label}
            </p>
            {day.items.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-2">—</p>
            ) : (
              <ul className="space-y-1">
                {day.items.map((occ) => (
                  <li
                    key={occ.id}
                    onClick={() => router.push(`/app/sessions/${occ.sessionGroupId}`)}
                    className="flex items-center gap-3 border rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
                  >
                    <span className="text-muted-foreground w-24 shrink-0">
                      {new Date(occ.startAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(occ.endAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex-1 font-medium">{occ.sessionNom}</span>
                    <Badge variant={STATUT_VARIANT[occ.statut] ?? "outline"}>
                      {STATUT_LABELS[occ.statut] ?? occ.statut}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
