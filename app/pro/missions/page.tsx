import { requireRole } from "@/server/context/server-context";
import { getProviderByUserId } from "@/server/queries/provider";
import { getMyPendingAndCancelledSlots } from "@/server/queries/provider-missions";
import { MissionsClient } from "./missions-client";

export default async function MissionsPage() {
  const ctx = await requireRole("provider");
  const provider = await getProviderByUserId(ctx.userId);

  const slots = provider
    ? await getMyPendingAndCancelledSlots(provider.id)
    : [];

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <h1 className="text-h-2xl font-semibold tracking-tight">Missions</h1>
      <MissionsClient slots={slots} />
    </div>
  );
}
