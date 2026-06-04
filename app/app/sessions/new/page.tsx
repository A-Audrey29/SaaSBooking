import { requireRole } from "@/server/context/server-context";
import { listWorkshopsForCentre } from "@/server/queries/session-group";
import { fetchRoleGroups } from "./session.actions";
import { SessionForm } from "./session-form";

export default async function NewSessionPage() {
  const ctx = await requireRole("referent");

  if (!ctx.centreId) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
        <p className="text-muted-foreground">Aucun centre associé à votre compte.</p>
      </div>
    );
  }

  const workshops = await listWorkshopsForCentre(ctx.centreId);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nouvelle séance</h1>

      {workshops.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun atelier disponible pour votre centre. Contactez un administrateur.
        </p>
      ) : (
        <SessionForm
          workshops={workshops}
          getRoleGroups={fetchRoleGroups}
        />
      )}
    </div>
  );
}
