import { requireRole } from "@/server/context/server-context";
import { listAllProviders } from "@/server/queries/provider";
import { listAllMetiers } from "@/server/queries/metier";
import { ProvidersDirectoryClient } from "./providers-directory-client";

export default async function AppProvidersPage() {
  await requireRole("referent");

  const [providers, metiers] = await Promise.all([
    listAllProviders(),
    listAllMetiers(),
  ]);

  return <ProvidersDirectoryClient providers={providers} metiers={metiers} />;
}
