import { notFound } from "next/navigation";
import { isNull } from "drizzle-orm";
import { getProjectById } from "@/server/queries/project";
import { requireRole } from "@/server/context/server-context";
import { db, schema } from "@/server/db/client";
import { ProjectSettingsClient } from "./settings-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectSettingsPage({ params }: Props) {
  await requireRole("super_admin");
  const { id } = await params;

  const [project, centres] = await Promise.all([
    getProjectById(id),
    db
      .select({ id: schema.centre.id, nom: schema.centre.nom })
      .from(schema.centre)
      .where(isNull(schema.centre.deletedAt)),
  ]);

  if (!project) notFound();

  return <ProjectSettingsClient project={project} centres={centres} />;
}
