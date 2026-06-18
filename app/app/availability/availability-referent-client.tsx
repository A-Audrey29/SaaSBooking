"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sendCartRequests } from "./availability.actions";
import type { ProviderDispoRow, SessionGroupCart } from "@/server/queries/referent-availability";

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

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
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

function initials(nom: string): string {
  return nom
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Couleurs par métier ───────────────────────────────────────────────────────

const PALETTE = [
  "#2563eb", "#dc2626", "#16a34a", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#ca8a04",
];

function metierColor(metierNom: string, allMetiers: string[]): string {
  const idx = allMetiers.indexOf(metierNom);
  return PALETTE[idx % PALETTE.length];
}

// ── Constantes grille ─────────────────────────────────────────────────────────

const SLOTS = Array.from({ length: 25 }, (_, i) => 7 + i * 0.5); // 7h → 19h par 30min
const SLOT_H = 32; // hauteur px d'un slot demi-heure (64px/heure)
const DOW = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];

/** Formate un slot décimal en "Xh00" ou "Xh30". */
function fmtSlot(slot: number): string {
  const h = Math.floor(slot);
  return `${h}h${slot % 1 === 0.5 ? "30" : "00"}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

const MAX_COLS = 4; // prestataires visibles par jour avant overflow

interface SlotBlock {
  id: string;
  startAt: Date;
  endAt: Date;
  kind: string;
  providerNom: string;
  providerId: string;
  metierNom: string;
  ville: string | null;
  color: string;
  columnIndex: number; // position dans la sous-colonne du jour
  columnCount: number; // nb total de colonnes affichées ce jour (≤ MAX_COLS - 1 si overflow)
  isPending: boolean;  // segment hachuré (pending ±30min buffer)
}

/** Découpe une dispo [dispoStart, dispoEnd] en segments libres/pending autour des pendingIntervals. */
function splitAvailability(
  dispoStart: Date,
  dispoEnd: Date,
  pendingIntervals: { startAt: Date; endAt: Date }[]
): { start: Date; end: Date; isPending: boolean }[] {
  // Garder uniquement les intervals qui chevauchent la dispo, triés par startAt
  const overlapping = pendingIntervals
    .filter((pi) => pi.startAt < dispoEnd && pi.endAt > dispoStart)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  if (overlapping.length === 0) {
    return [{ start: dispoStart, end: dispoEnd, isPending: false }];
  }

  const segments: { start: Date; end: Date; isPending: boolean }[] = [];
  let cursor = dispoStart;

  for (const pi of overlapping) {
    const pStart = pi.startAt < dispoStart ? dispoStart : pi.startAt;
    const pEnd = pi.endAt > dispoEnd ? dispoEnd : pi.endAt;
    if (cursor < pStart) {
      segments.push({ start: cursor, end: pStart, isPending: false });
    }
    segments.push({ start: pStart, end: pEnd, isPending: true });
    cursor = pEnd;
  }

  if (cursor < dispoEnd) {
    segments.push({ start: cursor, end: dispoEnd, isPending: false });
  }

  return segments;
}

interface CartItem {
  /** ticketSlotId à passer en pending */
  ticketSlotId: string;
  providerId: string;
  providerNom: string;
  metierNom: string;
  color: string;
  startAt: Date;
  endAt: Date;
}

interface CellPopup {
  day: Date;
  slot: number; // décimal ex: 9 → 9h00, 9.5 → 9h30
  x: number;
  y: number;
}

interface Atelier {
  id: string;
  nom: string;
  metierNoms: string[];
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  providers: ProviderDispoRow[];
  metierNoms: string[];
  sessionGroup: SessionGroupCart | null;
  ateliers: Atelier[];
}

export function AvailabilityReferentClient({ providers, metierNoms, sessionGroup, ateliers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [filterMetiers, setFilterMetiers] = useState<Set<string>>(() => new Set());
  const [filterAtelierId, setFilterAtelierId] = useState<string>("");
  const [hoveredSlot, setHoveredSlot] = useState<SlotBlock | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [popup, setPopup] = useState<CellPopup | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (!sessionGroup) return [];
    const targetOcc = sessionGroup.occurrences.find(
      (o) => o.ticketSlots.some((s) => s.statut === "pending")
    ) ?? sessionGroup.occurrences[0];
    if (!targetOcc?.startAt || !targetOcc?.endAt) return [];

    const metierList = [...new Set(providers.map((p) => p.metierNom))].sort();
    return targetOcc.ticketSlots
      .filter((s) => s.statut === "pending" && s.providerId)
      .map((s) => {
        const prov = providers.find((p) => p.providerId === s.providerId);
        return {
          ticketSlotId: s.ticketSlotId,
          providerId: s.providerId!,
          providerNom: prov?.providerNom ?? "",
          metierNom: s.providerRole,
          color: metierColor(s.providerRole, metierList),
          startAt: new Date(targetOcc.startAt!),
          endAt: new Date(targetOcc.endAt!),
        };
      });
  });
  const [sendError, setSendError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dateConflictWarning, setDateConflictWarning] = useState<string | null>(null);

  const slotsToSend = useMemo(() => {
    if (!sessionGroup) return [];
    return cart.filter((item) => {
      const existingSlot = sessionGroup.occurrences
        .flatMap((o) => o.ticketSlots)
        .find((s) => s.ticketSlotId === item.ticketSlotId);
      return !(existingSlot?.statut === "pending" && existingSlot?.providerId === item.providerId);
    });
  }, [cart, sessionGroup]);

  const allMetiers = useMemo(
    () => [...new Set(providers.map((p) => p.metierNom))].sort(),
    [providers]
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  // Grille mois : 6 semaines (lun → dim) couvrant le mois affiché
  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [monthStart]);

  // Map dayISO → métiers distincts ayant une dispo "available" ce jour-là
  const metiersPerDayInMonth = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of providers) {
      if (filterMetiers.size > 0 && !filterMetiers.has(p.metierNom)) continue;
      for (const a of p.availabilities) {
        if (a.kind !== "available") continue;
        const start = new Date(a.startAt);
        const dayISO = start.toDateString();
        const set = map.get(dayISO) ?? new Set<string>();
        set.add(p.metierNom);
        map.set(dayISO, set);
      }
    }
    return map;
  }, [providers, filterMetiers]);

  // Map dayISO → providerId[] ordonnés (pour assigner les sous-colonnes)
  const providerColumnsPerDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of providers) {
      if (filterMetiers.size > 0 && !filterMetiers.has(p.metierNom)) continue;
      for (const a of p.availabilities) {
        const start = new Date(a.startAt);
        if (start < weekStart || start >= addWeeks(weekStart, 1)) continue;
        if (a.kind !== "available") continue;
        const dayISO = start.toDateString();
        const cols = map.get(dayISO) ?? [];
        if (!cols.includes(p.providerId)) cols.push(p.providerId);
        map.set(dayISO, cols);
      }
    }
    return map;
  }, [providers, weekStart, filterMetiers]);

  const blocks = useMemo<SlotBlock[]>(() => {
    const result: SlotBlock[] = [];
    for (const p of providers) {
      if (filterMetiers.size > 0 && !filterMetiers.has(p.metierNom)) continue;
      const color = metierColor(p.metierNom, allMetiers);
      for (const a of p.availabilities) {
        const start = new Date(a.startAt);
        const end = new Date(a.endAt);
        if (start < weekStart || start >= addWeeks(weekStart, 1)) continue;
        if (a.kind !== "available") continue;
        const dayISO = start.toDateString();
        const cols = providerColumnsPerDay.get(dayISO) ?? [];
        const colIdx = cols.indexOf(p.providerId);
        // Tronquer à MAX_COLS - 1 pour laisser place au badge +N
        const hasOverflow = cols.length > MAX_COLS;
        const visibleCols = hasOverflow ? MAX_COLS - 1 : cols.length;
        if (colIdx >= visibleCols) continue; // hors limite affichage
        const columnCount = hasOverflow ? MAX_COLS : visibleCols;
        const segments = splitAvailability(start, end, p.pendingIntervals.map((pi) => ({
          startAt: new Date(pi.startAt),
          endAt: new Date(pi.endAt),
        })));
        for (let si = 0; si < segments.length; si++) {
          const seg = segments[si];
          result.push({
            id: `${a.id}:${seg.isPending ? "pending" : "free"}:${si}`,
            startAt: seg.start,
            endAt: seg.end,
            kind: a.kind,
            providerNom: p.providerNom,
            providerId: p.providerId,
            metierNom: p.metierNom,
            ville: p.ville ?? null,
            color,
            columnIndex: colIdx,
            columnCount,
            isPending: seg.isPending,
          });
        }
      }
    }
    return result;
  }, [providers, weekStart, filterMetiers, allMetiers, providerColumnsPerDay]);

  const visibleProviderCount = useMemo(() => {
    const ids = new Set(
      providers
        .filter((p) => filterMetiers.size === 0 || filterMetiers.has(p.metierNom))
        .map((p) => p.providerId)
    );
    return ids.size;
  }, [providers, filterMetiers]);

  const gridTop = SLOTS[0];

  // ── Popup : prestataires dispo sur la cellule cliquée ──────────────────────

  function getProvidersForCell(day: Date, slot: number): { providerId: string; providerNom: string; metierNom: string; color: string; ville: string | null; isPending: boolean }[] {
    const h = Math.floor(slot);
    const m = slot % 1 === 0.5 ? 30 : 0;
    const cellStart = new Date(day);
    cellStart.setHours(h, m, 0, 0);
    const cellEnd = new Date(cellStart.getTime() + 30 * 60 * 1000); // +30min

    const result: { providerId: string; providerNom: string; metierNom: string; color: string; ville: string | null; isPending: boolean }[] = [];
    const seen = new Set<string>();

    for (const p of providers) {
      if (filterMetiers.size > 0 && !filterMetiers.has(p.metierNom)) continue;
      for (const a of p.availabilities) {
        const aStart = new Date(a.startAt);
        const aEnd = new Date(a.endAt);
        // Chevauchement : dispo.start < cellEnd AND dispo.end > cellStart
        if (a.kind === "available" && aStart < cellEnd && aEnd > cellStart) {
          if (!seen.has(p.providerId)) {
            seen.add(p.providerId);
            // Pending si un interval pending chevauche exactement la cellule cliquée
            const isPending = p.pendingIntervals.some(
              (pi) => new Date(pi.startAt) < cellEnd && new Date(pi.endAt) > cellStart
            );
            result.push({
              providerId: p.providerId,
              providerNom: p.providerNom,
              metierNom: p.metierNom,
              color: metierColor(p.metierNom, allMetiers),
              ville: p.ville ?? null,
              isPending,
            });
          }
          break;
        }
      }
    }

    // Trier par métier puis nom
    return result.sort((a, b) => a.metierNom.localeCompare(b.metierNom) || a.providerNom.localeCompare(b.providerNom));
  }

  function handleCellClick(day: Date, slot: number, e: React.MouseEvent) {
    e.stopPropagation();
    setPopup({ day, slot, x: e.clientX, y: e.clientY });
    setHoveredSlot(null);
  }

  // ── Panier ────────────────────────────────────────────────────────────────

  function resolveTicketSlotId(metierNom: string): string | null {
    if (!sessionGroup) return null;
    for (const occ of sessionGroup.occurrences) {
      const slot = occ.ticketSlots.find(
        (s) =>
          s.providerRole === metierNom &&
          (s.statut === "empty" || s.statut === "refused" || s.statut === "pending")
      );
      if (slot) return slot.ticketSlotId;
    }
    return null;
  }

  function addToCart(provider: { providerId: string; providerNom: string; metierNom: string; color: string }, day: Date, slot: number) {
    if (!sessionGroup) return;

    const ticketSlotId = resolveTicketSlotId(provider.metierNom);
    if (!ticketSlotId) return;

    const h = Math.floor(slot);
    const m = slot % 1 === 0.5 ? 30 : 0;
    const startAt = new Date(day);
    startAt.setHours(h, m, 0, 0);
    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + sessionGroup.durationMin);

    // Toutes les occurrences partagent le même créneau — bloquer si date différente
    const existingItem = cart.find((i) => i.metierNom !== provider.metierNom);
    if (existingItem && existingItem.startAt.getTime() !== startAt.getTime()) {
      setDateConflictWarning(
        `Créneau différent de ${fmtTime(existingItem.startAt)} (${existingItem.startAt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}). Toutes les occurrences doivent être au même créneau.`
      );
      return;
    }

    setDateConflictWarning(null);
    setCart((prev) => {
      // Remplacer si même métier déjà dans le panier
      const filtered = prev.filter((item) => item.metierNom !== provider.metierNom);
      return [
        ...filtered,
        { ticketSlotId, providerId: provider.providerId, providerNom: provider.providerNom, metierNom: provider.metierNom, color: provider.color, startAt, endAt },
      ];
    });
    setPopup(null);
  }

  function removeFromCart(metierNom: string) {
    setCart((prev) => prev.filter((i) => i.metierNom !== metierNom));
  }

  const requiredRoles = sessionGroup?.requiredRoles ?? [];
  const cartReady = cart.length > 0;

  function handleSend() {
    if (!sessionGroup || !cartReady) return;
    setSendError(null);
    startTransition(async () => {
      if (slotsToSend.length === 0) {
        router.push(`/app/sessions/${sessionGroup.id}`);
        return;
      }

      const result = await sendCartRequests({
        sessionGroupId: sessionGroup.id,
        slots: slotsToSend.map((i) => ({
          ticketSlotId: i.ticketSlotId,
          providerId: i.providerId,
          startAt: i.startAt,
          endAt: i.endAt,
        })),
      });
      if (result.ok) {
        router.push(`/app/sessions/${sessionGroup.id}`);
      } else {
        setSendError(result.error);
      }
    });
  }

  const hasCart = !!sessionGroup;

  return (
    <div className={hasCart ? "grid gap-6 items-start" : "space-y-4"} style={hasCart ? { gridTemplateColumns: "1fr 300px" } : undefined}>
      {/* ── Colonne gauche : calendrier ── */}
      <div className="space-y-4">
        {/* Barre de contrôles */}
        <div className="flex flex-wrap items-center gap-3">
          {ateliers.length > 0 && (
            <select
              value={filterAtelierId}
              onChange={(e) => {
                const id = e.target.value;
                setFilterAtelierId(id);
                const atelier = ateliers.find((a) => a.id === id);
                setFilterMetiers(atelier ? new Set(atelier.metierNoms) : new Set());
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Tous les ateliers</option>
              {ateliers.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          )}

          {metierNoms.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs text-orange-700">
              Filtré sur : {metierNoms.join(" · ")}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {visibleProviderCount} prestataire{visibleProviderCount !== 1 ? "s" : ""}
            </span>
            <div className="flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => setView("week")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "week" ? "bg-foreground text-background" : "hover:bg-accent"}`}
              >
                Semaine
              </button>
              <button
                type="button"
                onClick={() => setView("month")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l ${view === "month" ? "bg-foreground text-background" : "hover:bg-accent"}`}
              >
                Mois
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {view === "week" ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addWeeks(w, -1))}>‹</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))} className="text-xs">Cette semaine</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>›</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMonthStart((m) => addMonths(m, -1))}>‹</Button>
            <Button variant="outline" size="sm" onClick={() => setMonthStart(startOfMonth(new Date()))} className="text-xs capitalize">
              {monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMonthStart((m) => addMonths(m, 1))}>›</Button>
          </div>
        )}

        {/* Légende métiers — clic = toggle multi-sélection */}
        {allMetiers.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {filterMetiers.size > 0 && (
              <button
                type="button"
                onClick={() => { setFilterMetiers(new Set()); setFilterAtelierId(""); }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Réinitialiser
              </button>
            )}
            {allMetiers.map((m) => {
              const active = filterMetiers.has(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setFilterAtelierId("");
                    setFilterMetiers((prev) => {
                      const next = new Set(prev);
                      if (next.has(m)) next.delete(m);
                      else next.add(m);
                      return next;
                    });
                  }}
                  className={`flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: metierColor(m, allMetiers) }} />
                  {m}
                </button>
              );
            })}
          </div>
        )}

        {/* Grille calendrier — vue semaine */}
        {view === "week" && (
        <div className="rounded-xl border border-border overflow-hidden" onClick={() => setPopup(null)}>
          {/* En-tête jours — sticky */}
          <div className="grid bg-background border-b" style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}>
            <div className="border-r bg-muted/20" />
            {days.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={i}
                  className={`py-3 text-center border-r last:border-r-0 select-none ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`text-[11px] font-medium uppercase tracking-widest mb-1 ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {DOW[i]}
                  </div>
                  <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                    isToday
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground"
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Corps grille scrollable */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)", minHeight: 400 }}>
            <div className="relative" style={{ height: SLOTS.length * SLOT_H }}>
              {/* Lignes horaires */}
              {SLOTS.map((s) => (
                <div
                  key={s}
                  className="absolute w-full flex items-start pointer-events-none"
                  style={{ top: (s - gridTop) * SLOT_H }}
                >
                  {/* Label heure */}
                  <div className="w-14 shrink-0 pr-3 text-right">
                    {s % 1 === 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground/70 -translate-y-2 inline-block">
                        {Math.floor(s)}h
                      </span>
                    )}
                  </div>
                  {/* Ligne */}
                  <div
                    className="flex-1"
                    style={{
                      borderTop: s % 1 === 0
                        ? "1px solid hsl(var(--border) / 0.5)"
                        : "1px dashed hsl(var(--border) / 0.25)",
                    }}
                  />
                </div>
              ))}

              {/* Colonnes jours */}
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}>
                <div className="border-r border-border/30 bg-muted/10" />
                {days.map((day, dayIdx) => {
                  const dayISO = day.toDateString();
                  const isToday = isSameDay(day, new Date());
                  const dayBlocks = blocks.filter((b) => isSameDay(b.startAt, day));
                  const allDayCols = providerColumnsPerDay.get(dayISO) ?? [];
                  const hasOverflow = allDayCols.length > MAX_COLS;
                  const overflowCount = hasOverflow ? allDayCols.length - (MAX_COLS - 1) : 0;

                  return (
                    <div
                      key={dayIdx}
                      className={`relative border-r last:border-r-0 border-border/30 ${
                        isToday ? "bg-primary/[0.02]" : ""
                      }`}
                    >
                      {/* Cellules cliquables par demi-heure — z-10 pour passer au-dessus des blocs */}
                      {hasCart && SLOTS.map((s) => (
                        <div
                          key={s}
                          className="absolute left-0 right-0 hover:bg-primary/8 cursor-pointer transition-colors rounded-sm z-10"
                          style={{ top: (s - gridTop) * SLOT_H, height: SLOT_H }}
                          onClick={(e) => handleCellClick(day, s, e)}
                        />
                      ))}

                      {/* Blocs disponibilités en sous-colonnes */}
                      {dayBlocks.map((b) => {
                        const top = (decimalHour(b.startAt) - gridTop) * SLOT_H;
                        const height = Math.max((decimalHour(b.endAt) - decimalHour(b.startAt)) * SLOT_H, 24);
                        const leftPct = (b.columnIndex / b.columnCount) * 100;
                        const widthPct = (1 / b.columnCount) * 100;
                        return (
                          <div
                            key={b.id}
                            className="absolute overflow-hidden z-20"
                            style={{
                              top: top + 1,
                              height: height - 2,
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                              borderRadius: 6,
                              backgroundColor: b.isPending
                                ? "transparent"
                                : b.color + "18",
                              borderLeft: `3px solid ${b.isPending ? "#94a3b8" : b.color}`,
                              backgroundImage: b.isPending
                                ? "repeating-linear-gradient(45deg, #94a3b81a 0px, #94a3b81a 4px, transparent 4px, transparent 9px)"
                                : undefined,
                              opacity: b.isPending ? 0.65 : 1,
                              cursor: hasCart ? "pointer" : "default",
                            }}
                            onMouseEnter={() => setHoveredSlot(b)}
                            onMouseLeave={() => setHoveredSlot(null)}
                            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                            onClick={hasCart ? (e) => handleCellClick(day, decimalHour(b.startAt), e) : undefined}
                          >
                            <div className="px-1.5 py-1 h-full flex flex-col justify-start gap-px">
                              <span
                                className="text-[10px] font-semibold leading-tight truncate"
                                style={{ color: b.isPending ? "#94a3b8" : b.color }}
                              >
                                {b.providerNom}
                              </span>
                              {height >= 44 && (
                                <span className="text-[9px] leading-tight opacity-75" style={{ color: b.isPending ? "#94a3b8" : b.color }}>
                                  {fmtTime(b.startAt)}–{fmtTime(b.endAt)}
                                </span>
                              )}
                              {b.ville && height >= 60 && !b.isPending && (
                                <span className="text-[9px] opacity-55 truncate" style={{ color: b.color }}>
                                  {b.ville}
                                </span>
                              )}
                              {b.isPending && height >= 44 && (
                                <span className="text-[9px] text-slate-400">Réservé</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Badge +N si overflow */}
                      {hasOverflow && (
                        <div
                          className="absolute top-2 flex items-center justify-center rounded-md text-[10px] font-semibold bg-muted border border-border text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
                          style={{
                            left: `calc(${((MAX_COLS - 1) / MAX_COLS) * 100}% + 2px)`,
                            width: `calc(${(1 / MAX_COLS) * 100}% - 4px)`,
                            height: SLOTS.length * SLOT_H - 16,
                          }}
                          title={`+${overflowCount} prestataire${overflowCount > 1 ? "s" : ""} — filtrez par métier pour voir`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterMetiers(new Set());
                            setFilterAtelierId("");
                          }}
                        >
                          +{overflowCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Grille calendrier — vue mois */}
        {view === "month" && (
          <div className="rounded-lg border overflow-hidden">
            <div className="grid border-b bg-muted/30" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
              {DOW.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
              {monthDays.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                const inMonth = day.getMonth() === monthStart.getMonth();
                const dayMetiers = [...(metiersPerDayInMonth.get(day.toDateString()) ?? [])];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setWeekStart(startOfWeek(day)); setView("week"); }}
                    className={`min-h-20 border-r border-b last:border-r-0 p-1.5 text-left hover:bg-accent transition-colors ${inMonth ? "" : "bg-muted/20"}`}
                  >
                    <span className={`text-xs ${isToday ? "w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold" : inMonth ? "text-foreground" : "text-muted-foreground"}`}>
                      {day.getDate()}
                    </span>
                    {dayMetiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {dayMetiers.map((m) => (
                          <span
                            key={m}
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: metierColor(m, allMetiers) }}
                            title={m}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prestataires sans dispo cette semaine */}
        {view === "week" && providers.length > 0 && blocks.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Aucune disponibilité déclarée cette semaine pour :</p>
            <ul className="space-y-1">
              {providers
                .filter((p) => filterMetiers.size === 0 || filterMetiers.has(p.metierNom))
                .map((p) => (
                  <li key={p.providerId} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: metierColor(p.metierNom, allMetiers) }} />
                    <span className="font-medium">{p.providerNom}</span>
                    <span className="text-muted-foreground">— {p.metierNom}</span>
                  </li>
                ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Navigue vers une autre semaine ou contacte ces prestataires pour qu&apos;ils renseignent leurs disponibilités.
            </p>
          </div>
        )}

        {providers.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Aucun prestataire trouvé{metierNoms.length > 0 ? " pour ces métiers" : ""}.
          </p>
        )}
      </div>

      {/* ── Colonne droite : panier ── */}
      {hasCart && sessionGroup && (
        <div className="rounded-lg border bg-card p-4 space-y-4 sticky top-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Séance à planifier</p>
            <p className="font-semibold text-sm">{sessionGroup.nom}</p>
          </div>

          {/* Métiers requis + état panier */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Métiers à couvrir :</p>
            {requiredRoles.map((role) => {
              const item = cart.find((i) => i.metierNom === role);
              const color = metierColor(role, allMetiers);
              const isAlreadyPending = item
                ? sessionGroup.occurrences
                    .flatMap((o) => o.ticketSlots)
                    .some((s) => s.ticketSlotId === item.ticketSlotId && s.statut === "pending" && s.providerId === item.providerId)
                : false;
              return (
                <div key={role} className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{role}</p>
                    {item ? (
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <div>
                          <p className="text-xs text-foreground">{item.providerNom}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.startAt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(item.startAt)}–{fmtTime(item.endAt)}
                          </p>
                        </div>
                        {isAlreadyPending ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200 shrink-0">
                            En attente
                          </span>
                        ) : (
                        <button
                          type="button"
                          onClick={() => removeFromCart(role)}
                          className="text-[10px] text-muted-foreground hover:text-destructive shrink-0"
                        >
                          ✕
                        </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">Cliquez un créneau →</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {dateConflictWarning && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              {dateConflictWarning}
            </p>
          )}

          {sendError && <p className="text-xs text-destructive">{sendError}</p>}

          <Button
            className="w-full"
            disabled={!cartReady || isPending}
            onClick={() => setShowConfirm(true)}
          >
            {isPending ? "Envoi…" : `Envoyer les demandes (${cart.length}/${requiredRoles.length})`}
          </Button>

          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer les demandes</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm">
                    {slotsToSend.length === 0 ? (
                      <p>Aucune nouvelle demande — tous les prestataires sont déjà en attente.</p>
                    ) : (
                      <>
                        <p>
                          {slotsToSend.length} demande{slotsToSend.length > 1 ? "s" : ""} sera{slotsToSend.length > 1 ? "ont" : ""} envoyée{slotsToSend.length > 1 ? "s" : ""} :
                        </p>
                        <ul className="space-y-2">
                          {slotsToSend.map((item) => (
                            <li key={item.ticketSlotId} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="font-medium">{item.metierNom}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{item.providerNom}</span>
                              <span className="text-muted-foreground text-xs ml-auto whitespace-nowrap">
                                {item.startAt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(item.startAt)}–{fmtTime(item.endAt)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {cart.length > slotsToSend.length && (
                          <p className="text-xs text-muted-foreground border-t pt-2">
                            {cart.length - slotsToSend.length} prestataire{cart.length - slotsToSend.length > 1 ? "s" : ""} déjà en attente — non renvoyé{cart.length - slotsToSend.length > 1 ? "s" : ""}.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setShowConfirm(false); handleSend(); }}>
                  {slotsToSend.length === 0 ? "OK" : `Envoyer ${slotsToSend.length > 1 ? "les " + slotsToSend.length + " demandes" : "la demande"}`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {cart.length < requiredRoles.length && (
            <p className="text-[10px] text-muted-foreground text-center">
              {requiredRoles.length - cart.length} métier{requiredRoles.length - cart.length > 1 ? "s" : ""} manquant{requiredRoles.length - cart.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* ── Popup cellule ── */}
      {popup && hasCart && (() => {
        const ph = Math.floor(popup.slot);
        const pm = popup.slot % 1 === 0.5 ? 30 : 0;
        const cellStart = new Date(popup.day);
        cellStart.setHours(ph, pm, 0, 0);
        const cellEnd = new Date(cellStart.getTime() + 30 * 60 * 1000);
        const available = getProvidersForCell(popup.day, popup.slot);
        const isRight = popup.x > (typeof window !== "undefined" ? window.innerWidth / 2 : 700);

        return (
          <div
            className="fixed z-50 rounded-lg border bg-background shadow-xl w-72 p-4 space-y-3"
            style={{
              top: Math.min(popup.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 320),
              left: isRight ? popup.x - 296 : popup.x + 8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">
                  {popup.day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-xs text-muted-foreground">{fmtSlot(popup.slot)} – {fmtSlot(popup.slot + 0.5)}</p>
              </div>
              <button type="button" onClick={() => setPopup(null)} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
            </div>

            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun prestataire disponible sur ce créneau.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{available.length} prestataire{available.length > 1 ? "s" : ""} disponible{available.length > 1 ? "s" : ""}</p>

                {/* Grouper par métier */}
                {[...new Set(available.map((p) => p.metierNom))].map((metier) => (
                  <div key={metier}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: metierColor(metier, allMetiers) }}>
                      {metier}
                    </p>
                    {available.filter((p) => p.metierNom === metier).map((p) => {
                      const alreadyInCart = cart.some((i) => i.metierNom === metier && i.providerId === p.providerId);
                      const slotExists = !!resolveTicketSlotId(metier);
                      return (
                        <div key={p.providerId} className="flex items-center gap-2 py-1.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: p.color }}>
                            {initials(p.providerNom)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.providerNom}</p>
                            {p.ville && <p className="text-[10px] text-muted-foreground truncate">📍 {p.ville}</p>}
                          </div>
                          {p.isPending ? (
                            <span className="text-[10px] px-2 py-1 rounded border border-slate-300 text-slate-500 bg-slate-50 shrink-0 cursor-not-allowed">
                              Réservé
                            </span>
                          ) : slotExists ? (
                            <button
                              type="button"
                              onClick={() => addToCart(p, popup.day, popup.slot)}
                              className={`text-xs px-2 py-1 rounded border transition-colors shrink-0 ${
                                alreadyInCart
                                  ? "border-green-400 text-green-700 bg-green-50"
                                  : "border-primary text-primary hover:bg-primary/5"
                              }`}
                            >
                              {alreadyInCart ? "✓ Ajouté" : "Ajouter →"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground shrink-0">Slot indispo</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Tooltip hover prestataire (hors mode panier) ── */}
      {hoveredSlot && !popup && (
        <div
          className="fixed z-40 rounded-lg border bg-background shadow-lg px-4 py-3 text-sm space-y-1 pointer-events-none"
          style={{
            left: mousePos.x + 14,
            top: mousePos.y - 10,
            transform: mousePos.x > (typeof window !== "undefined" ? window.innerWidth - 220 : 900) ? "translateX(-110%)" : undefined,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hoveredSlot.color }} />
            <p className="font-semibold">{hoveredSlot.providerNom}</p>
          </div>
          <p className="text-muted-foreground text-xs">{hoveredSlot.metierNom}</p>
          {hoveredSlot.ville && (
            <p className="text-muted-foreground text-xs">📍 {hoveredSlot.ville}</p>
          )}
          <p className="text-xs capitalize">
            {hoveredSlot.startAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <p className="font-medium text-xs">{fmtTime(hoveredSlot.startAt)} – {fmtTime(hoveredSlot.endAt)}</p>
          {hoveredSlot.isPending && (
            <p className="text-[10px] text-slate-500 border-t pt-1">Créneau réservé (±30 min trajet)</p>
          )}
        </div>
      )}
    </div>
  );
}
