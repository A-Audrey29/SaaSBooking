import { requireRole } from "@/server/context/server-context";
import { listActiveCentres, listUsersForAdmin } from "@/server/queries/admin-supervision";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  await requireRole("super_admin");

  const [users, centres] = await Promise.all([listUsersForAdmin(), listActiveCentres()]);

  return <UsersClient users={users} centres={centres} />;
}
