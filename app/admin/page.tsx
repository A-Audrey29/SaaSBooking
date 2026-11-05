import Link from "next/link";
import { requireRole } from "@/server/context/server-context";
import {
  STALE_PENDING_DAYS,
  getDashboardStats,
  listBookings,
  listIncompleteProviders,
} from "@/server/queries/admin-supervision";
import { formatAgo, formatDate } from "./_components/format";

export default async function AdminPage() {
  const ctx = await requireRole("super_admin", "project_admin");

  // Supervision data is cross-centre: super_admin only (decision 2026-11-04).
  if (ctx.role !== "super_admin") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Espace Admin</h1>
        <p className="text-muted-foreground">Bienvenue dans l&apos;espace d&apos;administration.</p>
      </div>
    );
  }

  const [stats, stalePending, incompleteProviders] = await Promise.all([
    getDashboardStats(),
    listBookings({ staleOnly: true }),
    listIncompleteProviders(),
  ]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto space-y-8">
      <h1 className="text-h-2xl font-semibold tracking-tight">Tableau de bord</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Demandes en attente" value={stats.pendingTotal} href="/admin/reservations?statut=pending" />
        <StatCard
          label={`Sans réponse > ${STALE_PENDING_DAYS} j`}
          value={stalePending.length}
          href="/admin/reservations?stale=1"
          alert
        />
        <StatCard label="Confirmées à venir" value={stats.confirmedUpcoming} href="/admin/reservations?statut=confirmed" />
        <StatCard label="Refus (30 j)" value={stats.refusedLast30Days} href="/admin/reservations?statut=refused" />
        <StatCard
          label="Emails en échec (7 j)"
          value={stats.emailsFailedLast7Days}
          href="/admin/journal?tab=emails&status=failed"
          alert
        />
        <StatCard label="Jamais connectés" value={stats.usersNeverLoggedIn} href="/admin/users" />
        <StatCard label="Invitations expirées" value={stats.invitationsExpired} href="/admin/users" alert />
        <StatCard label="Prestataires incomplets" value={incompleteProviders.length} href="#prestataires" alert />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">
          Demandes sans réponse depuis plus de {STALE_PENDING_DAYS} jours
        </h2>
        {stalePending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune. 👍</p>
        ) : (
          <ul className="border rounded-lg divide-y text-sm">
            {stalePending.map((b) => (
              <li key={b.slotId} className="px-4 py-2 flex flex-wrap justify-between gap-2">
                <span>
                  <strong>{b.providerNom ?? "—"}</strong> · {b.workshopNom} ({b.sessionNom}) ·{" "}
                  {b.centreNom}
                </span>
                <span className="text-muted-foreground">
                  séance {formatDate(b.occurrenceStartAt)} · envoyée {formatAgo(b.sentAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="prestataires">
        <h2 className="text-lg font-semibold mb-2">Prestataires à relancer</h2>
        {incompleteProviders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun. 👍</p>
        ) : (
          <ul className="border rounded-lg divide-y text-sm">
            {incompleteProviders.map((p) => (
              <li key={p.key} className="px-4 py-2 flex flex-wrap justify-between gap-2">
                <span>
                  <strong>{p.nom}</strong> · {p.email}
                </span>
                <span className="text-muted-foreground">
                  {p.reason === "no_profile"
                    ? "Profil prestataire non créé"
                    : "Aucune disponibilité à venir"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  alert = false,
}: {
  label: string;
  value: number;
  href: string;
  /** Highlight in red when value > 0 (something needs action). */
  alert?: boolean;
}) {
  const highlighted = alert && value > 0;
  return (
    <Link
      href={href}
      className={`rounded-lg border p-4 hover:bg-muted/50 transition-colors ${
        highlighted ? "border-red-300 bg-red-50" : ""
      }`}
    >
      <div className={`text-2xl font-semibold ${highlighted ? "text-red-700" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Link>
  );
}
