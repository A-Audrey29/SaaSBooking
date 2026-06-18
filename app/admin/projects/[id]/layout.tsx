import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@/server/queries/project";
import { requireRole } from "@/server/context/server-context";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
  await requireRole("super_admin");
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">
      <div className="mb-1">
        <Link
          href="/admin/projects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Projets
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{project.nom}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {project.centres.map((c) => c.nom).join(", ") || "—"}
      </p>
      <Separator className="mb-4" />
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={`/admin/projects/${id}`}>Vue d&apos;ensemble</Link>
          </TabsTrigger>
          <TabsTrigger value="workshops" asChild>
            <Link href={`/admin/projects/${id}/workshops`}>Ateliers</Link>
          </TabsTrigger>
          <TabsTrigger value="providers" asChild>
            <Link href={`/admin/projects/${id}/providers`}>Prestataires</Link>
          </TabsTrigger>
          <TabsTrigger value="sessions" asChild>
            <Link href={`/admin/projects/${id}/sessions`}>Séances</Link>
          </TabsTrigger>
          <TabsTrigger value="settings" asChild>
            <Link href={`/admin/projects/${id}/settings`}>Paramètres</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
