import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  const sg = await db.execute(sql`SELECT id, nom, workshop_id, centre_id, created_at FROM session_group ORDER BY created_at DESC LIMIT 3`);
  console.log("session_groups:", sg.rows);

  const occ = await db.execute(sql`SELECT id, session_group_id, index, start_at, end_at, statut, workshop_role_group_id FROM occurrence ORDER BY created_at DESC LIMIT 6`);
  console.log("occurrences:", occ.rows);

  const tkt = await db.execute(sql`SELECT id, occurrence_id, statut FROM ticket ORDER BY created_at DESC LIMIT 6`);
  console.log("tickets:", tkt.rows);

  const ts = await db.execute(sql`SELECT id, ticket_id, provider_role, workshop_role_slot_id, statut FROM ticket_slot ORDER BY created_at DESC LIMIT 10`);
  console.log("ticket_slots:", ts.rows);
}
main().catch(console.error);
