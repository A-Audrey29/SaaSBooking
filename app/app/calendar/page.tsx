import { notFound } from "next/navigation";
import { requireRole } from "@/server/context/server-context";
import { getOccurrencesForCentre } from "@/server/queries/calendar";
import { CalendarView } from "./calendar-view";

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default async function CalendarPage() {
  const ctx = await requireRole("referent", "project_admin");

  if (!ctx.centreId) notFound();

  // Load ±4 weeks around current week to cover client-side navigation without refetch
  const monday = startOfWeek(new Date());
  const from = new Date(monday);
  from.setDate(from.getDate() - 28);
  const to = new Date(monday);
  to.setDate(to.getDate() + 35);

  const occurrences = await getOccurrencesForCentre(ctx.centreId, from, to);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Calendrier</h1>
      <CalendarView occurrences={occurrences} />
    </div>
  );
}
