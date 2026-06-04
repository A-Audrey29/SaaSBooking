import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  const chain = await db.execute(sql`
    SELECT
      w.id AS workshop_id, w.nom AS workshop_nom,
      wt.id AS type_id, wt.nom AS type_nom,
      wrg.id AS group_id, wrg.label AS group_label,
      wrs.id AS slot_id, wrs.is_optional,
      m.nom AS metier_nom
    FROM workshop w
    LEFT JOIN workshop_type wt ON wt.id = w.type_id
    LEFT JOIN workshop_role_group wrg ON wrg.workshop_type_id = wt.id AND wrg.deleted_at IS NULL
    LEFT JOIN workshop_role_slot wrs ON wrs.workshop_role_group_id = wrg.id AND wrs.deleted_at IS NULL
    LEFT JOIN metier m ON m.id = wrs.metier_id
    WHERE w.deleted_at IS NULL
    ORDER BY w.nom, wrg.ordre, wrs.ordre
  `);
  console.log("Workshop → Type → RoleGroup → RoleSlot → Metier :");
  console.log(JSON.stringify(chain.rows, null, 2));

  const pa = await db.execute(sql`
    SELECT pa.id, pa.provider_id, pa.project_id, pa.metier_id, p.nom AS provider_nom
    FROM provider_assignment pa
    JOIN provider p ON p.id = pa.provider_id
    WHERE pa.deleted_at IS NULL
  `);
  console.log("provider_assignments:", JSON.stringify(pa.rows, null, 2));
}
main().catch(console.error);
