/**
 * audit-prod-schema.ts
 * Compares prod DB columns against local migration files.
 * Read-only — never alters anything.
 *
 * Usage:
 *   npx tsx scripts/audit-prod-schema.ts              # prod
 *   ENV_FILE=.env.local npx tsx scripts/audit-prod-schema.ts  # dev
 */
import { config } from "dotenv";
import { resolve } from "path";

const envFile = process.env.ENV_FILE ?? "server/lib/.env.prod.local";
config({ path: resolve(process.cwd(), envFile) });

import { neon } from "@neondatabase/serverless";

// ─── Expected schema: table → columns (derived from Drizzle schema TS files) ──
// Source of truth: server/db/schema/*.ts
// Run this script whenever you add a column to catch drift early.
const EXPECTED: Record<string, string[]> = {
  // auth.ts — Better Auth tables (emailVerified is boolean, camelCase column kept by Better Auth)
  user:                    ["id", "email", "emailVerified", "name", "image", "centre_id", "role", "password_set", "created_at", "updated_at", "deleted_at"],
  session:                 ["id", "expires_at", "token", "ip_address", "user_agent", "user_id", "created_at", "updated_at"],
  account:                 ["id", "account_id", "provider_id", "access_token", "refresh_token", "id_token", "expires_at", "password", "user_id", "created_at", "updated_at"],
  verification:            ["id", "identifier", "value", "expires_at", "created_at", "updated_at"],
  // centre.ts
  centre:                  ["id", "nom", "adresse", "ville", "timezone", "telephone", "email", "created_at", "updated_at", "deleted_at"],
  // project.ts
  project:                 ["id", "centre_id", "nom", "description", "financeur", "start_date", "end_date", "created_at", "updated_at", "deleted_at"],
  // workshop.ts
  workshop_type:           ["id", "centre_id", "code", "nom", "description", "created_at", "updated_at", "deleted_at"],
  workshop:                ["id", "project_id", "centre_id", "type_id", "nom", "description", "seances_count", "duration_min", "created_at", "updated_at", "deleted_at"],
  workshop_role_group:     ["id", "workshop_type_id", "label", "ordre", "created_at", "updated_at", "deleted_at"],
  workshop_role_slot:      ["id", "workshop_role_group_id", "metier_id", "is_optional", "ordre", "created_at", "updated_at", "deleted_at"],
  // metier.ts
  metier:                  ["id", "nom", "color", "created_at", "updated_at", "deleted_at"],
  // provider.ts
  provider:                ["id", "user_id", "nom", "email", "telephone", "ville", "metier_id", "bio", "created_at", "updated_at", "deleted_at"],
  provider_availability:   ["id", "provider_id", "start_at", "end_at", "kind", "created_at", "updated_at", "deleted_at"],
  // session.ts
  session_group:           ["id", "workshop_id", "centre_id", "nom", "audience", "notes", "session_number", "seance_number", "created_by", "created_at", "updated_at", "deleted_at"],
  // occurrence.ts
  occurrence:              ["id", "session_group_id", "index", "start_at", "end_at", "lieu", "salle", "notes", "statut", "workshop_role_group_id", "created_at", "updated_at", "deleted_at"],
  // ticket.ts
  ticket:                  ["id", "occurrence_id", "statut", "created_at", "updated_at", "deleted_at"],
  ticket_slot:             ["id", "ticket_id", "provider_role", "workshop_role_slot_id", "provider_id", "statut", "sent_at", "responded_at", "created_at", "updated_at", "deleted_at"],
};

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Fetch all columns from prod for our tables
  const rows = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${Object.keys(EXPECTED)})
    ORDER BY table_name, ordinal_position
  `;

  // Build map: table → Set<column>
  const actual: Record<string, Set<string>> = {};
  for (const row of rows) {
    if (!actual[row.table_name]) actual[row.table_name] = new Set();
    actual[row.table_name].add(row.column_name);
  }

  let hasIssue = false;

  for (const [table, expectedCols] of Object.entries(EXPECTED)) {
    const prodCols = actual[table];

    if (!prodCols) {
      console.log(`\n❌ TABLE MISSING: ${table}`);
      hasIssue = true;
      continue;
    }

    const missing = expectedCols.filter((c) => !prodCols.has(c));
    const extra   = [...prodCols].filter((c) => !expectedCols.includes(c));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`✓ ${table}`);
    } else {
      hasIssue = true;
      console.log(`\n⚠️  ${table}`);
      if (missing.length) console.log(`   MISSING in prod : ${missing.join(", ")}`);
      if (extra.length)   console.log(`   EXTRA in prod   : ${extra.join(", ")} (ignoré, pas bloquant)`);
    }
  }

  console.log(hasIssue ? "\n→ Des colonnes manquent en prod." : "\n✓ Prod DB alignée avec le schéma local.");
}

main().catch(console.error);
