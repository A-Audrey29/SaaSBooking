import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { listAllMetiers } from "@/server/queries/metier";
import { ProfileForm, ProfileCreateForm } from "./profile-form";

export default async function ProfilePage() {
  const ctx = await requireRole("provider");

  // Resolve provider via userId (BDR-010)
  const [provider] = await db
    .select({
      nom: schema.provider.nom,
      email: schema.provider.email,
      telephone: schema.provider.telephone,
      ville: schema.provider.ville,
      bio: schema.provider.bio,
      metierNom: schema.metier.nom,
    })
    .from(schema.provider)
    .leftJoin(schema.metier, eq(schema.provider.metierId, schema.metier.id))
    .where(
      and(
        eq(schema.provider.userId, ctx.userId),
        isNull(schema.provider.deletedAt)
      )
    );

  if (!provider) {
    const metiers = await listAllMetiers();
    return (
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[760px] mx-auto space-y-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Créer mon profil</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Renseignez vos informations pour apparaître dans l&apos;annuaire des prestataires.
          </p>
        </div>
        <section className="rounded-xl border border-border bg-card p-5">
          <ProfileCreateForm metiers={metiers} />
        </section>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[760px] mx-auto space-y-5">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight">{provider.nom}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {provider.metierNom ?? "—"}
          {provider.ville ? ` · ${provider.ville}` : ""}
        </p>
      </div>

      {/* Informations fixes — lecture seule */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-[14px] font-semibold mb-3">Informations administratives</h2>
        <dl className="space-y-2 text-[13px]">
          <div className="flex justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{provider.email}</dd>
          </div>
          <div className="flex justify-between pb-0">
            <dt className="text-muted-foreground">Métier</dt>
            <dd className="font-medium">{provider.metierNom ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Email et métier modifiables par un administrateur uniquement.
        </p>
      </section>

      {/* Informations modifiables */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-[14px] font-semibold mb-4">Mes informations</h2>
        <ProfileForm
          defaultValues={{
            telephone: provider.telephone,
            ville: provider.ville,
            bio: provider.bio,
          }}
        />
      </section>
    </div>
  );
}
