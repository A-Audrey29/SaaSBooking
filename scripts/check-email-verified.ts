import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  const rows = await db.execute(
    sql`SELECT id, email, "emailVerified" FROM "user" ORDER BY created_at`
  );

  console.log("Total users:", rows.rows.length);
  for (const row of rows.rows) {
    console.log({ id: row.id, email: row.email, emailVerified: row.emailVerified });
  }

  const nullCount = rows.rows.filter((r) => r.emailVerified === null).length;
  const nonNullCount = rows.rows.filter((r) => r.emailVerified !== null).length;
  console.log(`\nnull: ${nullCount} | non-null: ${nonNullCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
