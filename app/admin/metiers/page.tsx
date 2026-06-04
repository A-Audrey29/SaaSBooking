import { requireRole } from "@/server/context/server-context";
import { listAllMetiers } from "@/server/queries/metier";
import { MetiersClient } from "./metiers-client";

export default async function MetiersPage() {
  await requireRole("super_admin");
  const metiers = await listAllMetiers();
  return <MetiersClient metiers={metiers} />;
}
