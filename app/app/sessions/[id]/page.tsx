import { notFound } from "next/navigation";
import { requireRole } from "@/server/context/server-context";
import { getSessionGroupDetail } from "@/server/queries/session-group";
import { getProvidersForSlot } from "@/server/queries/ticket-slot";
import { SessionDetailClient } from "./session-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await requireRole("referent");

  if (!ctx.centreId) notFound();

  const detail = await getSessionGroupDetail(id, ctx.centreId);
  if (!detail) notFound();

  // Load providers for each empty slot (server-side, one query per slot)
  const providersMap: Record<string, Awaited<ReturnType<typeof getProvidersForSlot>>> = {};
  for (const occ of detail.occurrences) {
    if (!occ.ticket) continue;
    for (const slot of occ.ticket.slots) {
      if (slot.statut === "empty") {
        providersMap[slot.id] = await getProvidersForSlot(slot.id, ctx.centreId);
      }
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{detail.nom}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {detail.workshopNom}
          {detail.typeNom && <span> · {detail.typeNom}</span>}
        </p>
      </div>
      <SessionDetailClient
        detail={detail}
        providersMap={providersMap}
        sessionGroupId={id}
      />
    </div>
  );
}
