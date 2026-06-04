import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Full columns for workshop_role_group
  const g = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'workshop_role_group'
    ORDER BY ordinal_position
  `;
  console.log('=== workshop_role_group columns ===');
  console.log(JSON.stringify(g, null, 2));

  // Full columns for workshop_role_slot
  const s = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'workshop_role_slot'
    ORDER BY ordinal_position
  `;
  console.log('\n=== workshop_role_slot columns ===');
  console.log(JSON.stringify(s, null, 2));

  // FKs for both tables
  const fks = await sql`
    SELECT
      tc.table_name, kcu.column_name,
      ccu.table_name AS foreign_table, ccu.column_name AS foreign_column,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('workshop_role_group', 'workshop_role_slot', 'occurrence', 'ticket_slot')
    ORDER BY tc.table_name
  `;
  console.log('\n=== FKs for group/slot/occurrence/ticket_slot ===');
  console.log(JSON.stringify(fks, null, 2));

  // Existing data
  const gdata = await sql`SELECT * FROM workshop_role_group`;
  console.log('\n=== workshop_role_group data ===');
  console.log(JSON.stringify(gdata, null, 2));

  const sdata = await sql`SELECT * FROM workshop_role_slot`;
  console.log('\n=== workshop_role_slot data ===');
  console.log(JSON.stringify(sdata, null, 2));
}

main().catch(console.error);
