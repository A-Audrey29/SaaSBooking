"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { ProviderDispoRow } from "@/server/queries/referent-availability";

// ── Helpers date ──────────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function addWeeks(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(d.getDate() + n * 7);
  return c;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function decimalHour(d: Date): number {
  return d.getHours() + d.getMinutes() / 60;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ── Couleurs par métier (palette déterministe) ────────────────────────────────

const PALETTE = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
  "#db2777", // pink
  "#ca8a04", // yellow
];

function metierColor(metierNom: string, allMetiers: string[]): string {
  const idx = allMetiers.indexOf(metierNom);
  return PALETTE[idx % PALETTE.length];
}

// ── Constantes grille ─────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7h → 19h
const SLOT_H = 48; // px par heure
const DOW = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];

// ── Types internes ────────────────────────────────────────────────────────────

interface SlotBlock {
  id: string;
  startAt: Date;
  endAt: Date;
  kind: string;
  providerNom: string;
  metierNom: string;
  color: string;
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  providers: ProviderDispoRow[];
  metierNoms: string[]; // métiers filtrés depuis l'URL
}

export function AvailabilityReferentClient({ providers, metierNoms }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [filterMetier, setFilterMetier] = useState<string>("all");
  const [hoveredSlot, setHoveredSlot] = useState<SlotBlock | null>(null);

  // Tous les métiers présents dans les données
  const allMetiers = useMemo(
    () => [...new Set(providers.map((p) => p.metierNom))].sort(),
    [providers]
  );

  // Jours de la semaine courante
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  // Blocs à afficher : dispos dans la semaine, filtrées par métier
  const blocks = useMemo<SlotBlock[]>(() => {
    const result: SlotBlock[] = [];
    for (const p of providers) {
      if (filterMetier !== "all" && p.metierNom !== filterMetier) continue;
      const color = metierColor(p.metierNom, allMetiers);
      for (const a of p.availabilities) {
        const start = new Date(a.startAt);
        const end = new Date(a.endAt);
        // Garde uniquement les créneaux qui commencent dans cette semaine
        if (start < weekStart || start >= addWeeks(weekStart, 1)) continue;
        if (a.kind !== "available") continue; // n'afficher que les dispo positives
        result.push({
          id: a.id,
          startAt: start,
          endAt: end,
          kind: a.kind,
          providerNom: p.providerNom,
          metierNom: p.metierNom,
          color,
        });
      }
    }
    return result;
  }, [providers, weekStart, filterMetier, allMetiers]);

  // Nombre de prestataires visibles (après filtre)
  const visibleProviderCount = useMemo(() => {
    const ids = new Set(
      providers
        .filter((p) => filterMetier === "all" || p.metierNom === filterMetier)
        .map((p) => p.providerId)
    );
    return ids.size;
  }, [providers, filterMetier]);

  const gridTop = HOURS[0]; // heure de début

  return (
    <div className="space-y-4">
      {/* ── Barre de contrôles ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtre métier */}
        <select
          value={filterMetier}
          onChange={(e) => setFilterMetier(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Tous les métiers</option>
          {allMetiers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Filtre actif depuis URL */}
        {metierNoms.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs text-orange-700">
            Filtré sur : {metierNoms.join(" · ")}
          </span>
        )}

        {/* Compteur */}
        <span className="ml-auto text-sm text-muted-foreground">
          {visibleProviderCount} prestataire{visibleProviderCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Navigation semaine ── */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addWeeks(w, -1))}>
          ‹
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
          className="text-xs"
        >
          Cette semaine
        </Button>
        <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
          ›
        </Button>
      </div>

      {/* ── Légende métiers ── */}
      {allMetiers.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {allMetiers.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterMetier(filterMetier === m ? "all" : m)}
              className={`flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors ${
                filterMetier === m
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: metierColor(m, allMetiers) }}
              />
              {m}
            </button>
          ))}
        </div>
      )}

      {/* ── Grille calendrier ── */}
      <div className="rounded-lg border overflow-auto">
        {/* En-tête jours */}
        <div className="grid border-b bg-muted/30" style={{ gridTemplateColumns: "3rem repeat(7, 1fr)" }}>
          <div className="border-r" /> {/* coin heure */}
          {days.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={i}
                className={`py-2 text-center text-xs font-medium border-r last:border-r-0 ${
                  isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="uppercase tracking-wide">{DOW[i]}</div>
                <div
                  className={`text-base font-semibold mt-0.5 ${
                    isToday
                      ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto"
                      : ""
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Corps grille */}
        <div className="relative" style={{ height: HOURS.length * SLOT_H }}>
          {/* Lignes heures */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full border-t border-border/50 flex"
              style={{ top: (h - gridTop) * SLOT_H }}
            >
              <div className="w-12 shrink-0 pr-2 text-right text-[10px] text-muted-foreground -translate-y-2.5">
                {h}h
              </div>
            </div>
          ))}

          {/* Colonnes jours */}
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: "3rem repeat(7, 1fr)" }}
          >
            <div className="border-r" /> {/* colonne heures */}
            {days.map((day, dayIdx) => {
              const dayBlocks = blocks.filter((b) => isSameDay(b.startAt, day));
              return (
                <div key={dayIdx} className="relative border-r last:border-r-0">
                  {dayBlocks.map((b) => {
                    const top = (decimalHour(b.startAt) - gridTop) * SLOT_H;
                    const height = Math.max(
                      (decimalHour(b.endAt) - decimalHour(b.startAt)) * SLOT_H,
                      20
                    );
                    return (
                      <div
                        key={b.id}
                        className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer overflow-hidden"
                        style={{
                          top,
                          height,
                          backgroundColor: b.color + "22",
                          borderLeft: `3px solid ${b.color}`,
                          color: b.color,
                        }}
                        onMouseEnter={() => setHoveredSlot(b)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        <span className="font-medium truncate block">{b.providerNom}</span>
                        {height > 28 && (
                          <span className="opacity-70">
                            {fmtTime(b.startAt)}–{fmtTime(b.endAt)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tooltip hover ── */}
      {hoveredSlot && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-background shadow-lg px-4 py-3 text-sm space-y-1 pointer-events-none">
          <p className="font-semibold">{hoveredSlot.providerNom}</p>
          <p className="text-muted-foreground">{hoveredSlot.metierNom}</p>
          <p>
            {hoveredSlot.startAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <p className="font-medium">
            {fmtTime(hoveredSlot.startAt)} – {fmtTime(hoveredSlot.endAt)}
          </p>
        </div>
      )}

      {/* ── Vide ── */}
      {providers.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Aucun prestataire trouvé{metierNoms.length > 0 ? " pour ces métiers" : ""}.
        </p>
      )}
    </div>
  );
}
