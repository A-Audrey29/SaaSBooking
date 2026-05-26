/**
 * Run Drizzle migrations.
 *
 * Usage: npm run db:migrate
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback on .env

import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("→ Running migrations...");

  await migrate(db, { migrationsFolder: "./server/db/migrations" });

  console.log("✓ Migrations completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
