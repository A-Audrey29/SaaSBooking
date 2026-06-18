import { notFound } from "next/navigation";
import { requireRole } from "@/server/context/server-context";
import {
  getProvidersDisposForCentre,
  getSessionGroupForCart,
  buildSyntheticCart,
  type NewSessionParams,
} from "@/server/queries/referent-availability";
import { listWorkshopsForCentre } from "@/server/queries/session-group";
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
  searchParams: Promise<{
    metiers?: string;
    sessionGroupId?: string;
    occurrenceId?: string;
    // Params mode "new" (création différée)
    workshopId?: string;
    workshopRoleGroupId?: string;
    checkedSlotIds?: string;
    nom?: string;
    sessionNumber?: string;
    seanceNumber?: string;
    notes?: string;
  }>;
}

export default async function AvailabilityPage({ searchParams }: Props) {
  const ctx = await requireRole("referent", "project_admin");
  if (!ctx.centreId) notFound();

  const params = await searchParams;
  const { metiers, sessionGroupId, occurrenceId } = params;
  const metierNoms = metiers
    ? metiers.split(",").map((m) => decodeURIComponent(m.trim())).filter(Boolean)
    : [];

  // Charger ±6 semaines autour de maintenant (couvre vue semaine + vue mois)
  const monday = startOfWeek(new Date());
  const from = new Date(monday);
  from.setDate(from.getDate() - 42);
  const to = new Date(monday);
  to.setDate(to.getDate() + 49);

  // Résoudre le cart : mode "existing" (sessionGroupId en DB) ou mode "new" (params URL)
  async function resolveSessionGroup() {
    if (sessionGroupId) {
      return getSessionGroupForCart(sessionGroupId, ctx.centreId!, occurrenceId);
    }
    if (params.workshopId && params.workshopRoleGroupId && params.checkedSlotIds && params.nom) {
      const newParams: NewSessionParams = {
        workshopId: params.workshopId,
        workshopRoleGroupId: params.workshopRoleGroupId,
        checkedSlotIds: params.checkedSlotIds.split(",").filter(Boolean),
        nom: decodeURIComponent(params.nom),
        sessionNumber: parseInt(params.sessionNumber ?? "1") || 1,
        seanceNumber: parseInt(params.seanceNumber ?? "1") || 1,
        notes: params.notes ? decodeURIComponent(params.notes) : undefined,
        metierNoms,
      };
      return buildSyntheticCart(newParams);
    }
    return null;
  }

  const [providers, sessionGroup, ateliers] = await Promise.all([
    getProvidersDisposForCentre(ctx.centreId, from, to),
    resolveSessionGroup(),
    listWorkshopsForCentre(ctx.centreId),
  ]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Disponibilités prestataires</h1>
      <AvailabilityReferentClient
        providers={providers}
        metierNoms={metierNoms}
        sessionGroup={sessionGroup}
        ateliers={ateliers.map((w) => ({
          id: w.id,
          nom: w.nom,
          metierNoms: [...new Set(w.defaultRoles.map((r) => r.nom))],
        }))}
      />
    </div>
  );
}
