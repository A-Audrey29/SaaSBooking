import { isNull, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  await requireRole("super_admin");

  const [users, centres] = await Promise.all([
    db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        name: schema.user.name,
        role: schema.user.role,
        centreId: schema.user.centreId,
        centreNom: schema.centre.nom,
        passwordSet: schema.user.passwordSet,
        createdAt: schema.user.createdAt,
      })
      .from(schema.user)
      .leftJoin(schema.centre, eq(schema.user.centreId, schema.centre.id))
      .where(isNull(schema.user.deletedAt)),
    db
      .select({ id: schema.centre.id, nom: schema.centre.nom })
      .from(schema.centre)
      .where(isNull(schema.centre.deletedAt)),
  ]);

  return <UsersClient users={users} centres={centres} />;
}
