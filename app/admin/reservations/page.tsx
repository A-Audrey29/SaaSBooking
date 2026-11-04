import Link from "next/link";
import { z } from "zod";
import { requireRole } from "@/server/context/server-context";
import {
  BOOKING_STATUTS,
  BOOKINGS_LIST_LIMIT,
  STALE_PENDING_DAYS,
  listActiveCentres,
  listBookings,
} from "@/server/queries/admin-supervision";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SELECT_CLASS,
  SLOT_STATUT_CLASS,
  SLOT_STATUT_LABEL,
  formatAgo,
  formatDate,
} from "../_components/format";

// Invalid / unknown query params are ignored (treated as "no filter") instead of erroring.
const FiltersSchema = z.object({
  statut: z.enum(BOOKING_STATUTS).optional().catch(undefined),
  centre: z.string().uuid().optional().catch(undefined),
  stale: z.literal("1").optional().catch(undefined),
});

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReservationsPage({ searchParams }: Props) {
  await requireRole("super_admin");
  const filters = FiltersSchema.parse(await searchParams);

  const [bookings, centres] = await Promise.all([
    listBookings({
      statut: filters.statut,
      centreId: filters.centre,
      staleOnly: filters.stale === "1",
    }),
    listActiveCentres(),
  ]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1300px] mx-auto">
      <h1 className="text-h-2xl font-semibold tracking-tight mb-1">Réservations</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Toutes les demandes envoyées aux prestataires, tous centres confondus.
      </p>

      <form method="get" className="flex gap-2 mb-4 flex-wrap items-center">
        <select name="statut" defaultValue={filters.statut ?? ""} className={SELECT_CLASS}>
          <option value="">Tous les statuts</option>
          {BOOKING_STATUTS.map((s) => (
            <option key={s} value={s}>
              {SLOT_STATUT_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="centre" defaultValue={filters.centre ?? ""} className={SELECT_CLASS}>
          <option value="">Tous les centres</option>
          {centres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stale" value="1" defaultChecked={filters.stale === "1"} />
          Sans réponse depuis plus de {STALE_PENDING_DAYS} jours
        </label>
        <Button type="submit" size="sm">
          Filtrer
        </Button>
        <Link href="/admin/reservations" className="text-sm text-muted-foreground underline">
          Réinitialiser
        </Link>
      </form>

      <p className="text-sm text-muted-foreground mb-2">
        {bookings.length} demande(s)
        {bookings.length === BOOKINGS_LIST_LIMIT && ` — limité aux ${BOOKINGS_LIST_LIMIT} plus récentes`}
      </p>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date séance</TableHead>
              <TableHead>Centre</TableHead>
              <TableHead>Atelier / session</TableHead>
              <TableHead>Référent</TableHead>
              <TableHead>Prestataire</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Envoyée</TableHead>
              <TableHead>Réponse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Aucune demande
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.slotId}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(b.occurrenceStartAt)}
                    <div className="text-xs text-muted-foreground">Séance {b.occurrenceIndex}</div>
                  </TableCell>
                  <TableCell>{b.centreNom}</TableCell>
                  <TableCell>
                    {b.workshopNom}
                    <div className="text-xs text-muted-foreground">{b.sessionNom}</div>
                  </TableCell>
                  <TableCell>
                    {b.referentName ?? "—"}
                    <div className="text-xs text-muted-foreground">{b.referentEmail}</div>
                  </TableCell>
                  <TableCell>
                    {b.providerNom ?? "—"}
                    <div className="text-xs text-muted-foreground">{b.providerEmail}</div>
                  </TableCell>
                  <TableCell>{b.providerRole}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${SLOT_STATUT_CLASS[b.statut] ?? ""}`}
                    >
                      {SLOT_STATUT_LABEL[b.statut] ?? b.statut}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatAgo(b.sentAt)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatAgo(b.respondedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
