import { notFound } from "next/navigation";
import { getProjectById } from "@/server/queries/project";
import { requireRole } from "@/server/context/server-context";
import {
  listProjectAssignments,
  listAvailableProviders,
} from "@/server/queries/provider-assignment";
import { listAllMetiers } from "@/server/queries/metier";
import { ProvidersClient } from "./providers-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectProvidersPage({ params }: Props) {
  await requireRole("super_admin");
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const [assignments, availableProviders, metiers] = await Promise.all([
    listProjectAssignments(id),
    listAvailableProviders(),
    listAllMetiers(),
  ]);

  return (
    <ProvidersClient
      projectId={id}
      assignments={assignments}
      availableProviders={availableProviders}
      metiers={metiers}
    />
  );
}
