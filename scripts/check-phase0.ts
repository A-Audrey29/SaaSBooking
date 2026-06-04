import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Check provider_role
  try {
    const rows = await sql`SELECT * FROM provider_role LIMIT 100`;
    console.log('=== provider_role ===');
    console.log('count:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e: any) {
    console.log('=== provider_role ===');
    console.log('ERROR:', e.message);
  }

  // Check workshop_type
  const wt = await sql`SELECT id, code, nom, centre_id, deleted_at FROM workshop_type`;
  console.log('\n=== workshop_type ===');
  console.log('count:', wt.length);
  console.log(JSON.stringify(wt, null, 2));

  // Check occurrence columns
  const occ = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'occurrence' ORDER BY ordinal_position`;
  console.log('\n=== occurrence columns ===');
  console.log(occ.map((r: any) => r.column_name).join(', '));

  // Check ticket_slot columns
  const ts = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'ticket_slot' ORDER BY ordinal_position`;
  console.log('\n=== ticket_slot columns ===');
  console.log(ts.map((r: any) => r.column_name).join(', '));

  // Check last migrations
  try {
    const mig = await sql`SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5`;
    console.log('\n=== last migrations ===');
    console.log(JSON.stringify(mig, null, 2));
  } catch {
    const mig2 = await sql`SELECT * FROM drizzle.journal ORDER BY idx DESC LIMIT 5`;
    console.log('\n=== last migrations (journal) ===');
    console.log(JSON.stringify(mig2, null, 2));
  }

  // Check workshop_role_group and workshop_role_slot
  try {
    const g = await sql`SELECT COUNT(*) as count FROM workshop_role_group`;
    console.log('\n=== workshop_role_group: EXISTS, count:', g[0].count);
  } catch {
    console.log('\n=== workshop_role_group: NOT EXISTS in DB');
  }
  try {
    const s = await sql`SELECT COUNT(*) as count FROM workshop_role_slot`;
    console.log('=== workshop_role_slot: EXISTS, count:', s[0].count);
  } catch {
    console.log('=== workshop_role_slot: NOT EXISTS in DB');
  }
}

main().catch(console.error);
