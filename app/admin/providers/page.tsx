import { requireRole } from "@/server/context/server-context";
import { listAllProviders } from "@/server/queries/provider";
import { ProvidersClient } from "./providers-client";

export default async function AdminProvidersPage() {
  await requireRole("super_admin");

  const providers = await listAllProviders();

  return <ProvidersClient providers={providers} />;
}
