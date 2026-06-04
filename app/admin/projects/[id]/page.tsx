import { notFound } from "next/navigation";
import { getProjectById, getProjectKpis } from "@/server/queries/project";
import { requireRole } from "@/server/context/server-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function ProjectOverviewPage({ params }: Props) {
  await requireRole("super_admin");
  const { id } = await params;
  const [project, kpis] = await Promise.all([getProjectById(id), getProjectKpis(id)]);
  if (!project) notFound();

  const days = daysRemaining(project.endDate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ateliers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{kpis.workshopCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prestataires affectés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{kpis.providerCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jours restants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {days === null ? "—" : days < 0 ? "Terminé" : days}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Financeur</span>
            <span>{project.financeur ?? "—"}</span>
            <span className="text-muted-foreground">Début</span>
            <span>{formatDate(project.startDate)}</span>
            <span className="text-muted-foreground">Fin</span>
            <span>{formatDate(project.endDate)}</span>
          </div>
          {project.description && (
            <p className="text-muted-foreground pt-2 border-t">{project.description}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
