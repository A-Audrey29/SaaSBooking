import { requireRole } from "@/server/context/server-context";
import { listSessionGroupsForCentre } from "@/server/queries/session-group";
import { SessionsListClient } from "./sessions-list-client";

export default async function ReferentHomePage() {
  const ctx = await requireRole("referent");

  if (!ctx.centreId) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
        <p className="text-muted-foreground">Aucun centre associé à votre compte.</p>
      </div>
    );
  }

  const sessions = await listSessionGroupsForCentre(ctx.centreId);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Mes séances</h1>
        <a
          href="/app/sessions/new"
          className="text-sm font-medium text-primary hover:underline"
        >
          + Nouvelle séance
        </a>
      </div>
      <SessionsListClient sessions={sessions} />
    </div>
  );
}
