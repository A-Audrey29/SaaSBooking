import { notFound } from "next/navigation";
import { getProjectById } from "@/server/queries/project";
import { listWorkshopsForProject, listAllWorkshopTypes } from "@/server/queries/workshop";
import { requireRole } from "@/server/context/server-context";
import { WorkshopsClient } from "./workshops-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectWorkshopsPage({ params }: Props) {
  await requireRole("super_admin");
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const [workshops, workshopTypes] = await Promise.all([
    listWorkshopsForProject(id),
    listAllWorkshopTypes(),
  ]);

  return (
    <WorkshopsClient
      projectId={id}
      workshops={workshops}
      workshopTypes={workshopTypes}
    />
  );
}
