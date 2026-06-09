import { notFound } from "next/navigation";
import { requireRole } from "@/server/context/server-context";
import { getProvidersDisposForCentre } from "@/server/queries/referent-availability";
import { AvailabilityReferentClient } from "./availability-referent-client";

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

interface Props {
  searchParams: Promise<{ metiers?: string }>;
}

export default async function AvailabilityPage({ searchParams }: Props) {
  const ctx = await requireRole("referent", "project_admin");
  if (!ctx.centreId) notFound();

  const { metiers } = await searchParams;
  const metierNoms = metiers
    ? metiers.split(",").map((m) => decodeURIComponent(m.trim())).filter(Boolean)
    : [];

  // Charger ±4 semaines autour de maintenant
  const monday = startOfWeek(new Date());
  const from = new Date(monday);
  from.setDate(from.getDate() - 28);
  const to = new Date(monday);
  to.setDate(to.getDate() + 35);

  const providers = await getProvidersDisposForCentre(
    ctx.centreId,
    from,
    to,
    metierNoms.length > 0 ? metierNoms : undefined
  );

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Disponibilités prestataires</h1>
      <AvailabilityReferentClient providers={providers} metierNoms={metierNoms} />
    </div>
  );
}
