// Option B — MEDIATION ignorée (0 provider_role associé)
// Nouveaux UUID générés, anciens IDs non préservés.

import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback on .env

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as schema from "../server/db/schema";

if (process.env.NODE_ENV === "production") {
  throw new Error("Migration script refuses to run in production");
}

neonConfig.fetchConnectionCache = true;

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

async function main() {
  console.log("→ Migration provider_role vers workshop_role_group + workshop_role_slot");

  // 1. Lire les provider_role existants avec leurs workshop_type
  const providerRoles = await db
    .select({
      id: schema.providerRole.id,
      workshopTypeId: schema.providerRole.workshopTypeId,
      workshopTypeCode: schema.workshopType.code,
      workshopTypeNom: schema.workshopType.nom,
      role: schema.providerRole.role,
      couleur: schema.providerRole.couleur,
      ordre: schema.providerRole.ordre,
    })
    .from(schema.providerRole)
    .innerJoin(
      schema.workshopType,
      eq(schema.providerRole.workshopTypeId, schema.workshopType.id)
    )
    .orderBy(schema.workshopType.code, schema.providerRole.ordre);

  console.log(`  → ${providerRoles.length} provider_role trouvés`);

  if (providerRoles.length === 0) {
    console.log("  → Aucune donnée à migrer");
    return;
  }

  // 2. Grouper par workshop_type_id
  const rolesByType = new Map<
    string,
    Array<{
      id: string;
      workshopTypeId: string;
      workshopTypeCode: string;
      workshopTypeNom: string;
      role: string;
      couleur: string;
      ordre: number;
    }>
  >();

  for (const pr of providerRoles) {
    if (!rolesByType.has(pr.workshopTypeId)) {
      rolesByType.set(pr.workshopTypeId, []);
    }
    rolesByType.get(pr.workshopTypeId)!.push(pr);
  }

  console.log(`  → ${rolesByType.size} workshop_type avec provider_role`);

  // 3. Créer 1 workshop_role_group par workshop_type ayant des provider_role
  let totalGroupsCreated = 0;
  let totalSlotsCreated = 0;

  for (const [workshopTypeId, roles] of rolesByType) {
    const workshopTypeCode = roles[0].workshopTypeCode;
    const workshopTypeNom = roles[0].workshopTypeNom;

    console.log(`  → Création groupe pour ${workshopTypeCode} (${roles.length} rôles)`);

    // Créer le groupe
    const [group] = await db
      .insert(schema.workshopRoleGroup)
      .values({
        workshopTypeId,
        label: "Configuration standard",
        ordre: 0,
      })
      .returning();

    totalGroupsCreated++;
    console.log(`    ✓ Groupe créé: ${group.id}`);

    // Créer les slots pour ce groupe
    for (const role of roles) {
      const [slot] = await db
        .insert(schema.workshopRoleSlot)
        .values({
          workshopRoleGroupId: group.id,
          role: role.role,
          couleur: role.couleur,
          isOptional: false,
          ordre: role.ordre,
        })
        .returning();

      totalSlotsCreated++;
      console.log(`      ✓ Slot créé: ${role.role} (${role.couleur}, ordre ${role.ordre})`);
    }
  }

  console.log(`\n  → Résumé:`);
  console.log(`    - ${totalGroupsCreated} workshop_role_group créés`);
  console.log(`    - ${totalSlotsCreated} workshop_role_slot créés`);

  // 4. Vérification finale : doit être exactement 5 workshop_role_slot
  const slotCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.workshopRoleSlot);

  const actualCount = Number(slotCount[0].count);

  if (actualCount !== 5) {
    throw new Error(
      `Attendu 5 workshop_role_slot, obtenu ${actualCount}`
    );
  }

  console.log(`\n  ✓ Vérification: ${actualCount} workshop_role_slot (attendu: 5)`);
  console.log("→ Migration terminée avec succès");
}

main()
  .catch((err) => {
    console.error("Erreur migration:", err);
    process.exit(1);
  });
