import { isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { listAllProjects } from "@/server/queries/project";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  await requireRole("super_admin");

  const [projects, centres] = await Promise.all([
    listAllProjects(),
    db
      .select({ id: schema.centre.id, nom: schema.centre.nom })
      .from(schema.centre)
      .where(isNull(schema.centre.deletedAt)),
  ]);

  return <ProjectsClient projects={projects} centres={centres} />;
}
