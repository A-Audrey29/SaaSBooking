import { redirect } from "next/navigation";
import { requireRole } from "@/server/context/server-context";
import {
  resolveProviderFromUser,
  getMyAvailabilitiesInRange,
} from "@/server/queries/provider-availability";
import { getMyConfirmedBookings } from "@/server/queries/provider-bookings";
import { AvailabilityClient } from "./availability-client";

export default async function DisposPage() {
  const ctx = await requireRole("provider");

  // Compte prestataire dont le profil n'est pas encore créé : on l'envoie au
  // formulaire de création (/pro/profile) plutôt que de lui afficher un 404,
  // qui laissait croire à une application cassée.
  const prov = await resolveProviderFromUser(ctx.userId);
  if (!prov) redirect("/pro/profile");

  // Fenêtre de chargement : 3 mois avant → 6 mois après aujourd'hui.
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 3);
  const to = new Date(now);
  to.setMonth(to.getMonth() + 6);

  const [availabilities, bookings] = await Promise.all([
    getMyAvailabilitiesInRange(prov.id, from, to),
    getMyConfirmedBookings(prov.id, from, to),
  ]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1300px] mx-auto">
      <h1 className="text-h-2xl font-semibold tracking-tight mb-5">Mes disponibilités</h1>
      <AvailabilityClient initialAvailabilities={availabilities} initialBookings={bookings} />
    </div>
  );
}
