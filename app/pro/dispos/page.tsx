import { notFound } from "next/navigation";
import { requireRole } from "@/server/context/server-context";
import { resolveProviderFromUser, getMyAvailabilities } from "@/server/queries/provider-availability";
import { AvailabilityClient } from "./availability-client";

export default async function DisposPage() {
  const ctx = await requireRole("provider");

  const prov = await resolveProviderFromUser(ctx.userId);
  if (!prov) notFound();

  const availabilities = await getMyAvailabilities(prov.id);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Mes disponibilités</h1>
      <AvailabilityClient initialAvailabilities={availabilities} />
    </div>
  );
}
