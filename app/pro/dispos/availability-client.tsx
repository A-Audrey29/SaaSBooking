"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createRecurringAvailabilitiesAction,
  createDateExceptionAction,
  deleteAvailabilityAction,
} from "./actions";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  todayISO,
  addDaysISO,
  startOfWeekISO,
  partsFromISO,
  fmtDayShortISO,
  fmtTime,
  fmtTimeRange,
  fmtDayShort,
  gpParts,
  gpDayISO,
  gpDecimalHour,
  MOIS_LONGS,
} from "./lib/dates";
import type { ProviderAvailabilityRow } from "@/server/queries/provider-availability";
import type { ProviderBookingRow } from "@/server/queries/provider-bookings";

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 8h → 18h
const SLOT_H = 56;
const DOW_LABELS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];

interface Props {
  initialAvailabilities: ProviderAvailabilityRow[];
  initialBookings: ProviderBookingRow[];
}

interface RecurringRange {
  start: string;
  end: string;
}
interface RecurringDay {
  enabled: boolean;
  ranges: RecurringRange[];
}

const defaultRecurring: RecurringDay[] = [
  { enabled: true, ranges: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  { enabled: true, ranges: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  { enabled: true, ranges: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  { enabled: true, ranges: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  { enabled: true, ranges: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  { enabled: false, ranges: [] },
  { enabled: false, ranges: [] },
];

export function AvailabilityClient({ initialAvailabilities, initialBookings }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(todayISO()));
  const [monthCursor, setMonthCursor] = useState(() => {
    const p = gpParts(new Date());
    return { y: p.y, m: p.mo };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Avails as parsed Date ranges (computed once).
  const avails = useMemo(
    () =>
      initialAvailabilities
        .filter((a) => a.kind === "available")
        .map((a) => ({
          id: a.id,
          start: new Date(a.startAt),
          end: new Date(a.endAt),
        })),
    [initialAvailabilities]
  );

  const bookings = useMemo(
    () => initialBookings.map((b) => ({ ...b, start: new Date(b.startAt), end: new Date(b.endAt) })),
    [initialBookings]
  );

  const selectedBooking = bookings.find((b) => b.occurrenceId === selected) ?? null;

  /** Une dispo chevauche-t-elle la cellule [hour, hour+1) ce jour GP ? */
  function isAvail(dayISO: string, hour: number): boolean {
    return avails.some((a) => {
      if (gpDayISO(a.start) !== dayISO) return false;
      const sh = gpDecimalHour(a.start);
      const eh = gpDecimalHour(a.end);
      return sh < hour + 1 && eh > hour;
    });
  }

  /** Heures dispo dans la fenêtre 8h–18h, pour le badge mois. */
  function availHours(dayISO: string): number {
    return HOURS.filter((h) => isAvail(dayISO, h)).length;
  }

  function bookingsForDay(dayISO: string) {
    return bookings.filter((b) => gpDayISO(b.start) === dayISO);
  }

  function handleDelete(id: string) {
    deleteAvailabilityAction({ availabilityId: id }).then(() => router.refresh());
  }

  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-t-sm text-ink-500">
          Vos créneaux disponibles et vos interventions confirmées.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-md border border-ink-200 bg-card overflow-hidden">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 h-8 text-t-xs font-medium ${
                  view === v ? "bg-ink-900 text-paper" : "text-ink-500 hover:bg-ink-50"
                }`}
              >
                {v === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setEditorOpen(true)}>
            + Modifier mes disponibilités
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-4 text-t-xs text-ink-500">
        <Legend swatch="bg-ink-50 border-ink-200" label="Indisponible" />
        <Legend swatch="bg-s-confirmed-bg border-s-confirmed-border" label="Disponible" />
        <Legend swatch="bg-brand-soft border-brand" label="Booking confirmé" />
      </div>

      {view === "week" ? (
        <WeekGrid
          days={days}
          weekStart={weekStart}
          onPrev={() => setWeekStart(addDaysISO(weekStart, -7))}
          onToday={() => setWeekStart(startOfWeekISO(todayISO()))}
          onNext={() => setWeekStart(addDaysISO(weekStart, 7))}
          isAvail={isAvail}
          bookingsForDay={bookingsForDay}
          onBookingClick={setSelected}
        />
      ) : (
        <MonthGrid
          y={monthCursor.y}
          m={monthCursor.m}
          onPrev={() => setMonthCursor((c) => ({ y: c.m === 0 ? c.y - 1 : c.y, m: c.m === 0 ? 11 : c.m - 1 }))}
          onNext={() => setMonthCursor((c) => ({ y: c.m === 11 ? c.y + 1 : c.y, m: c.m === 11 ? 0 : c.m + 1 }))}
          onToday={() => {
            const p = gpParts(new Date());
            setMonthCursor({ y: p.y, m: p.mo });
          }}
          availHours={availHours}
          bookingsForDay={bookingsForDay}
          onBookingClick={setSelected}
        />
      )}

      {/* Drawer détail booking */}
      <BookingDrawer booking={selectedBooking} onClose={() => setSelected(null)} />

      {/* Drawer édition récurrent */}
      <EditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}

// ─── Vue Semaine ──────────────────────────────────────────────────────────────

function WeekGrid({
  days,
  weekStart,
  onPrev,
  onToday,
  onNext,
  isAvail,
  bookingsForDay,
  onBookingClick,
}: {
  days: string[];
  weekStart: string;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  isAvail: (dayISO: string, hour: number) => boolean;
  bookingsForDay: (dayISO: string) => Array<ProviderBookingRow & { start: Date; end: Date }>;
  onBookingClick: (id: string) => void;
}) {
  void weekStart;
  return (
    <>
      <div className="flex items-center gap-2">
        <NavBtn onClick={onPrev}>‹</NavBtn>
        <button onClick={onToday} className="h-8 px-3 rounded-md border border-ink-200 text-t-xs hover:bg-ink-50">
          Cette semaine
        </button>
        <NavBtn onClick={onNext}>›</NavBtn>
        <span className="text-t-xs text-ink-500 ml-2">
          {fmtDayShortISO(days[0])} → {fmtDayShortISO(days[6])}
        </span>
      </div>

      <div className="rounded-xl border border-ink-150 bg-card overflow-hidden">
        {/* En-têtes jours */}
        <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          <div className="border-b border-r border-ink-150 bg-ink-50 h-12" />
          {days.map((d) => {
            const p = partsFromISO(d);
            const isToday = d === todayISO();
            return (
              <div
                key={d}
                className={`border-b border-r border-ink-150 px-2 py-2 text-center last:border-r-0 ${
                  isToday ? "bg-brand-soft" : "bg-ink-50"
                }`}
              >
                <div className="text-t-xs uppercase tracking-wider text-ink-400">
                  {fmtDayShortISO(d).split(" ")[0]}
                </div>
                <div className={`text-h-sm font-semibold ${isToday ? "text-brand-ink" : "text-ink-900"}`}>
                  {p.d}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grille heures */}
        <div className="relative grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="text-right pr-2 border-r border-b border-ink-150 text-[10px] text-ink-400"
                style={{ height: SLOT_H }}
              >
                <span className="-mt-1.5 inline-block">{h}h</span>
              </div>
            ))}
          </div>
          {days.map((d) => {
            const events = bookingsForDay(d);
            return (
              <div key={d} className="relative border-r border-ink-150 last:border-r-0">
                {HOURS.map((h) => {
                  const avail = isAvail(d, h);
                  return (
                    <div
                      key={h}
                      className={`w-full block border-b border-ink-150 ${
                        avail ? "bg-s-confirmed-bg" : "bg-ink-50"
                      }`}
                      style={{ height: SLOT_H }}
                    />
                  );
                })}
                {events.map((b) => {
                  const startH = gpDecimalHour(b.start);
                  const endH = gpDecimalHour(b.end);
                  const top = (startH - 8) * SLOT_H;
                  const height = Math.max((endH - startH) * SLOT_H, 24);
                  return (
                    <button
                      key={b.ticketSlotId}
                      onClick={() => onBookingClick(b.occurrenceId)}
                      className="absolute left-1 right-1 rounded-md border-2 border-brand bg-brand-soft px-2 py-1.5 text-left overflow-hidden hover:shadow-md transition-shadow"
                      style={{ top, height, color: "var(--brand-ink)" }}
                    >
                      <div className="text-t-xs font-semibold truncate">{b.workshopNom}</div>
                      <div className="text-[10px] truncate opacity-90">{b.centreNom}</div>
                      <div className="text-[10px] mt-0.5 opacity-75">
                        {fmtTime(b.start)} · S{b.index} · {b.sessionNom}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Vue Mois ─────────────────────────────────────────────────────────────────

function MonthGrid({
  y,
  m,
  onPrev,
  onNext,
  onToday,
  availHours,
  bookingsForDay,
  onBookingClick,
}: {
  y: number;
  m: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  availHours: (dayISO: string) => number;
  bookingsForDay: (dayISO: string) => Array<ProviderBookingRow & { start: Date; end: Date }>;
  onBookingClick: (id: string) => void;
}) {
  const first = new Date(Date.UTC(y, m, 1));
  const firstDow = first.getUTCDay() === 0 ? 7 : first.getUTCDay();
  const offset = firstDow - 1;
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells: Array<{ date?: string; d?: number }> = [];
  for (let i = 0; i < offset; i++) cells.push({});
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, d });
  }
  while (cells.length % 7 !== 0) cells.push({});

  return (
    <>
      <div className="flex items-center gap-2">
        <NavBtn onClick={onPrev}>‹</NavBtn>
        <button onClick={onToday} className="h-8 px-3 rounded-md border border-ink-200 text-t-xs hover:bg-ink-50">
          Aujourd&apos;hui
        </button>
        <NavBtn onClick={onNext}>›</NavBtn>
        <span className="text-h-sm font-semibold ml-2 capitalize">
          {MOIS_LONGS[m]} {y}
        </span>
      </div>

      <div className="rounded-xl border border-ink-150 bg-card overflow-hidden">
        <div className="grid grid-cols-7 bg-ink-50 border-b border-ink-150">
          {DOW_LABELS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-t-xs uppercase tracking-wider text-ink-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            if (!c.date)
              return <div key={i} className="border-r border-b border-ink-150 bg-ink-50 min-h-[96px] last:border-r-0" />;
            const isToday = c.date === todayISO();
            const dayBookings = bookingsForDay(c.date);
            const hours = availHours(c.date);
            return (
              <div
                key={i}
                className={`border-r border-b border-ink-150 min-h-[96px] p-1.5 last:border-r-0 ${
                  isToday ? "bg-brand-soft" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-t-sm font-medium ${isToday ? "text-brand-ink" : "text-ink-900"}`}>{c.d}</span>
                  {hours > 0 && (
                    <span className="text-[10px] text-s-confirmed-ink bg-s-confirmed-bg border border-s-confirmed-border rounded-full px-1.5">
                      {hours}h
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayBookings.map((b) => (
                    <button
                      key={b.ticketSlotId}
                      onClick={() => onBookingClick(b.occurrenceId)}
                      className="w-full text-left rounded-sm bg-brand-soft border border-brand px-1.5 py-0.5 text-[10px] truncate hover:shadow-sm"
                      style={{ color: "var(--brand-ink)" }}
                    >
                      {fmtTime(b.start)} {b.workshopNom}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Drawer détail booking ────────────────────────────────────────────────────

function BookingDrawer({
  booking,
  onClose,
}: {
  booking: (ProviderBookingRow & { start: Date; end: Date }) | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {booking && (
          <>
            <SheetHeader>
              <SheetDescription>Intervention confirmée</SheetDescription>
              <SheetTitle>{booking.workshopNom}</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 text-t-sm mt-4">
              <Section label="Quand">
                <div className="text-ink-900 font-medium">{fmtDayShort(booking.start)}</div>
                <div className="text-ink-500">{fmtTimeRange(booking.start, booking.end)}</div>
              </Section>
              <Section label="Centre social">
                <div className="text-ink-900 font-medium">{booking.centreNom}</div>
                {booking.centreAdresse && <div className="text-ink-500">{booking.centreAdresse}</div>}
                {booking.centreTelephone && (
                  <a
                    href={`tel:${booking.centreTelephone.replace(/\s/g, "")}`}
                    className="text-brand-ink hover:underline"
                  >
                    {booking.centreTelephone}
                  </a>
                )}
              </Section>
              <Section label="Détails séance">
                <Detail term="Atelier" def={booking.workshopNom} />
                <Detail term="Session" def={booking.sessionNom} />
                <Detail term="Séance" def={`n°${booking.index}`} />
                <Detail term="Salle" def={booking.salle ?? "—"} />
                <Detail term="Public" def={booking.audience ?? "—"} />
                {booking.sessionNotes && (
                  <div className="mt-2 pt-2 border-t border-ink-150">
                    <div className="text-t-xs uppercase tracking-wider text-ink-400 mb-1">
                      Notes du référent
                    </div>
                    <p className="text-ink-700 leading-relaxed">{booking.sessionNotes}</p>
                  </div>
                )}
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Drawer édition récurrent ─────────────────────────────────────────────────

function EditorDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [recurring, setRecurring] = useState<RecurringDay[]>(defaultRecurring);
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(addDaysISO(todayISO(), 56)); // 8 semaines par défaut
  const [exceptionDate, setExceptionDate] = useState(todayISO());
  const [exceptionKind, setExceptionKind] = useState<"available" | "unavailable">("unavailable");
  const [activeTab, setActiveTab] = useState<"recurring" | "window" | "exceptions">("recurring");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await createRecurringAvailabilitiesAction({ weekdays: recurring, from, to });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const parts = [];
      if (res.created > 0) parts.push(`${res.created} créneau(x) créé(s)`);
      if (res.deleted > 0) parts.push(`${res.deleted} créneau(x) supprimé(s)`);
      setInfo(parts.length > 0 ? parts.join(", ") + "." : "Aucun changement (rien à créer ni supprimer).");
      router.refresh();
    });
  }

  function saveException() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await createDateExceptionAction({ date: exceptionDate, kind: exceptionKind });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const label = exceptionKind === "unavailable" ? "Indisponible" : "Disponible";
      const parts = [`Journée marquée "${label}"`];
      if (res.deleted > 0) parts.push(`${res.deleted} créneau(x) existant(s) supprimé(s)`);
      setInfo(parts.join(", ") + ".");
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-[460px] overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetDescription>Planning</SheetDescription>
          <SheetTitle>Modifier mes disponibilités</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4 flex-1">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="recurring">Récurrent</TabsTrigger>
            <TabsTrigger value="window">Période</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          </TabsList>

          <TabsContent value="recurring" className="space-y-3">
            <p className="text-t-xs text-ink-500">
              Définissez vos plages horaires habituelles pour chaque jour de la semaine.
            </p>
            {recurring.map((day, idx) => (
              <div key={idx} className="rounded-lg border border-ink-150 bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="inline-flex items-center gap-2 text-t-sm font-medium">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) =>
                        setRecurring((r) =>
                          r.map((d, i) =>
                            i === idx
                              ? {
                                  ...d,
                                  enabled: e.target.checked,
                                  ranges:
                                    e.target.checked && d.ranges.length === 0
                                      ? [{ start: "09:00", end: "17:00" }]
                                      : d.ranges,
                                }
                              : d
                          )
                        )
                      }
                    />
                    {DOW_LABELS[idx]}
                  </label>
                  {day.enabled && (
                    <button
                      onClick={() =>
                        setRecurring((r) =>
                          r.map((d, i) =>
                            i === idx ? { ...d, ranges: [...d.ranges, { start: "14:00", end: "17:00" }] } : d
                          )
                        )
                      }
                      className="text-t-xs text-brand-ink hover:underline"
                    >
                      + Plage
                    </button>
                  )}
                </div>
                {day.enabled ? (
                  <div className="space-y-1.5">
                    {day.ranges.map((r, ri) => (
                      <div key={ri} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={r.start}
                          onChange={(e) =>
                            setRecurring((rr) =>
                              rr.map((d, i) =>
                                i === idx
                                  ? { ...d, ranges: d.ranges.map((rg, rgi) => (rgi === ri ? { ...rg, start: e.target.value } : rg)) }
                                  : d
                              )
                            )
                          }
                          className="h-8 w-24"
                        />
                        <span className="text-ink-400">→</span>
                        <Input
                          type="time"
                          value={r.end}
                          onChange={(e) =>
                            setRecurring((rr) =>
                              rr.map((d, i) =>
                                i === idx
                                  ? { ...d, ranges: d.ranges.map((rg, rgi) => (rgi === ri ? { ...rg, end: e.target.value } : rg)) }
                                  : d
                              )
                            )
                          }
                          className="h-8 w-24"
                        />
                        <button
                          onClick={() =>
                            setRecurring((rr) =>
                              rr.map((d, i) => (i === idx ? { ...d, ranges: d.ranges.filter((_, rgi) => rgi !== ri) } : d))
                            )
                          }
                          className="h-7 w-7 grid place-items-center text-ink-400 hover:text-ink-900"
                          aria-label="Supprimer la plage"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-t-xs text-ink-400">Indisponible</p>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="window" className="space-y-3">
            <p className="text-t-xs text-ink-500">
              Période sur laquelle déployer vos plages récurrentes. Les jours qui ont déjà un
              créneau sont ignorés.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={from}
                max={to}
                onChange={(e) => {
                  const v = e.target.value;
                  setFrom(v);
                  if (v && to && v > to) setTo(v);
                }}
                className="h-8"
              />
              <span className="text-ink-400">→</span>
              <Input
                type="date"
                value={to}
                min={from}
                onChange={(e) => {
                  const v = e.target.value;
                  setTo(v);
                  if (v && from && v < from) setFrom(v);
                }}
                className="h-8"
              />
            </div>
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-3">
            <p className="text-t-xs text-ink-500">
              Déclarez une exception ponctuelle pour une journée précise (jour férié, congé,
              disponibilité exceptionnelle…).
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={exceptionDate}
                onChange={(e) => setExceptionDate(e.target.value)}
                className="h-8"
              />
              <Select value={exceptionKind} onValueChange={(v) => setExceptionKind(v as typeof exceptionKind)}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unavailable">Indisponible</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="text-t-sm text-destructive">{error}</p>}
        {info && <p className="text-t-sm text-s-confirmed-ink">{info}</p>}

        <SheetFooter className="mt-4">
          <Button
            onClick={activeTab === "exceptions" ? saveException : save}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="h-8 w-8 grid place-items-center rounded-md border border-ink-200 hover:bg-ink-50"
    >
      {children}
    </button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink-150 bg-card p-3.5">
      <div className="text-t-xs uppercase tracking-wider text-ink-400 mb-2">{label}</div>
      {children}
    </section>
  );
}

function Detail({ term, def }: { term: string; def: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-t-sm">
      <dt className="text-ink-500">{term}</dt>
      <dd className="text-ink-900 font-medium text-right">{def}</dd>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-4 rounded-sm border ${swatch}`} />
      {label}
    </span>
  );
}
