import { requireRole } from "@/server/context/server-context";
import { listSessionGroupsForProject } from "@/server/queries/session-group";
import { ProjectSessionsClient } from "./project-sessions-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectSessionsPage({ params }: Props) {
  await requireRole("super_admin");
  const { id } = await params;
  const sessions = await listSessionGroupsForProject(id);
  return <ProjectSessionsClient sessions={sessions} />;
}
