import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. audit_log.centre_id nullable
  const auditCol = await sql`
    SELECT column_name, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'audit_log' AND column_name = 'centre_id'
  `;
  console.log("audit_log.centre_id:", auditCol[0]);

  // 2. user.password_set exists with default false
  const userCol = await sql`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'password_set'
  `;
  console.log("user.password_set:", userCol[0]);

  // 3. user_invitation table columns
  const invitationCols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'user_invitation'
    ORDER BY ordinal_position
  `;
  console.log("user_invitation columns:", invitationCols);

  // 4. __drizzle_migrations latest entry
  const migrations = await sql`
    SELECT id, hash, created_at
    FROM __drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 3
  `;
  console.log("__drizzle_migrations (last 3):", migrations);
}

main().catch(console.error);
