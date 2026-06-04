/**
 * Run Drizzle migrations.
 *
 * Usage: npm run db:migrate
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback on .env

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  console.log("→ Running migrations...");

  await migrate(db, { migrationsFolder: "./server/db/migrations" });

  await pool.end();
  console.log("✓ Migrations completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
