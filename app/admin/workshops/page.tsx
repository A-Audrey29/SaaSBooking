import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/context/server-context";
import { isNull } from "drizzle-orm";
import { WorkshopsClient } from "./workshops-client";

export default async function WorkshopsPage() {
  await requireRole("super_admin");

  const workshopTypes = await db.query.workshopType.findMany({
    where: isNull(schema.workshopType.deletedAt),
    with: {
      centre: { columns: { id: true, nom: true } },
      workshopRoleGroups: {
        where: isNull(schema.workshopRoleGroup.deletedAt),
        with: {
          workshopRoleSlots: {
            where: isNull(schema.workshopRoleSlot.deletedAt),
            orderBy: (s, { asc }) => [asc(s.ordre)],
          },
        },
        orderBy: (g, { asc }) => [asc(g.ordre)],
      },
    },
    orderBy: (t, { asc }) => [asc(t.code)],
  });

  const centres = await db
    .select({ id: schema.centre.id, nom: schema.centre.nom })
    .from(schema.centre)
    .where(isNull(schema.centre.deletedAt));

  return <WorkshopsClient workshopTypes={workshopTypes} centres={centres} />;
}
