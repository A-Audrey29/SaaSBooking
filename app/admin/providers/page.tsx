import { requireRole } from "@/server/context/server-context";
import { listAllProviders } from "@/server/queries/provider";
import { listAllMetiers } from "@/server/queries/metier";
import { ProvidersClient } from "./providers-client";

export default async function AdminProvidersPage() {
  await requireRole("super_admin");

  const [providers, metiers] = await Promise.all([
    listAllProviders(),
    listAllMetiers(),
  ]);

  return <ProvidersClient providers={providers} metiers={metiers} />;
}
