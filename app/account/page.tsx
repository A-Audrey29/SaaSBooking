import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireAuth, getRedirectForRole } from "@/server/context/server-context";
import { ChangePasswordForm } from "./change-password-form";

const roleLabel: Record<string, string> = {
  super_admin: "Super admin",
  project_admin: "Admin projet",
  referent: "Référent",
  provider: "Prestataire",
};

export default async function AccountPage() {
  const ctx = await requireAuth();

  const [user] = await db
    .select({
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      centreId: schema.user.centreId,
      centreNom: schema.centre.nom,
    })
    .from(schema.user)
    .leftJoin(schema.centre, eq(schema.user.centreId, schema.centre.id))
    .where(eq(schema.user.id, ctx.userId));

  if (!user) {
    return null;
  }

  const backHref = getRedirectForRole(ctx.role);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-[760px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center text-[13px] font-semibold">
              A
            </div>
            <span className="text-[14px] font-semibold">Asanblé</span>
          </Link>
          <Link href={backHref} className="text-[13px] text-muted-foreground hover:text-foreground">
            ← Retour
          </Link>
        </div>
      </header>

      <div className="max-w-[760px] mx-auto px-4 md:px-8 py-8 space-y-5">
        <div className="mb-2">
          <h1 className="text-[22px] font-semibold tracking-tight">Mon compte</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {roleLabel[user.role] ?? user.role}
            {user.centreNom ? ` · ${user.centreNom}` : ""}
          </p>
        </div>

        {/* Informations — lecture seule */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[15px] font-semibold mb-4">Informations</h2>
          <dl className="space-y-3 text-[13px]">
            <div className="flex justify-between border-b border-border pb-3">
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-medium">{user.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <dt className="text-muted-foreground">Rôle</dt>
              <dd className="font-medium">{roleLabel[user.role] ?? user.role}</dd>
            </div>
            {user.centreNom && (
              <div className="flex justify-between pb-0">
                <dt className="text-muted-foreground">Centre</dt>
                <dd className="font-medium">{user.centreNom}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Pour modifier ces informations, contactez un administrateur.
          </p>
        </section>

        {/* Changement de mot de passe */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
