import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const users = await db.execute(sql`SELECT id, email, role, centre_id FROM "user" ORDER BY created_at DESC LIMIT 10`);
  console.log("users:", JSON.stringify(users.rows, null, 2));
  const centres = await db.execute(sql`SELECT id, nom FROM centre WHERE deleted_at IS NULL`);
  console.log("centres:", JSON.stringify(centres.rows, null, 2));
  const workshops = await db.execute(sql`SELECT w.id, w.nom, p.centre_id FROM workshop w JOIN project p ON p.id = w.project_id WHERE w.deleted_at IS NULL LIMIT 5`);
  console.log("workshops:", JSON.stringify(workshops.rows, null, 2));
  const providers = await db.execute(sql`SELECT p.id, p.nom, pa.project_id FROM provider p LEFT JOIN provider_assignment pa ON pa.provider_id = p.id WHERE p.deleted_at IS NULL LIMIT 5`);
  console.log("providers:", JSON.stringify(providers.rows, null, 2));
}
main().catch(console.error);
