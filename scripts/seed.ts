import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback on .env

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";

if (process.env.NODE_ENV === "production") {
  throw new Error("Seed script refuses to run in production");
}

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("→ Seeding database...");

  // Clear existing data (order matters due to FK constraints)
  await db.delete(schema.ticketSlot);
  await db.delete(schema.ticket);
  await db.delete(schema.occurrence);
  await db.delete(schema.sessionGroup);
  await db.delete(schema.workshop);
  await db.delete(schema.providerAssignment);
  await db.delete(schema.provider);
  await db.delete(schema.workshopRoleSlot);
  await db.delete(schema.workshopRoleGroup);
  await db.delete(schema.workshopType);
  await db.delete(schema.project);
  await db.delete(schema.centre);
  await db.delete(schema.account);
  await db.delete(schema.session);
  await db.delete(schema.verification);
  await db.delete(schema.user);

  // Create centre
  const [centreData] = await db
    .insert(schema.centre)
    .values({
      nom: "FEVES",
      adresse: "Adresse dev",
      ville: "Dev",
      timezone: "America/Guadeloupe",
      telephone: "0590 12 34 56",
      email: "contact@feves.dev",
    })
    .returning();
  console.log(`  → Centre: ${centreData.nom}`);

  // Create seed users
  const [superAdmin] = await db
    .insert(schema.user)
    .values({
      email: "admin@saasbooking.dev",
      name: "Super Admin",
      role: "super_admin",
      centreId: null,
    })
    .returning();
  console.log(`  → Super Admin: ${superAdmin.email}`);

  const [referent1] = await db
    .insert(schema.user)
    .values({
      email: "referent1@cs-abymes.gp",
      name: "Marie Dupont",
      role: "referent",
      centreId: centreData.id,
    })
    .returning();

  const [referent2] = await db
    .insert(schema.user)
    .values({
      email: "referent2@cs-abymes.gp",
      name: "Jean Martin",
      role: "referent",
      centreId: centreData.id,
    })
    .returning();
  console.log(`  → Referents: ${referent1.email}, ${referent2.email}`);

  const [providerUser] = await db
    .insert(schema.user)
    .values({
      email: "jean.dumont@provider.dev",
      name: "Jean Dumont",
      role: "provider",
      centreId: null,
    })
    .returning();
  console.log(`  → Provider user: ${providerUser.email}`);

  // Create project
  const [project] = await db
    .insert(schema.project)
    .values({
      centreId: centreData.id,
      nom: "Passerelle CAP 2026",
      description: "Programme passerelle CAP — accompagnement familles",
      financeur: "CAF Guadeloupe",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })
    .returning();
  console.log(`  → Project: ${project.nom}`);

  // Create workshop types (with centre_id)
  const [type1] = await db
    .insert(schema.workshopType)
    .values({
      centreId: centreData.id,
      code: "PARENTALITE",
      nom: "Parentalité",
      description: "Ateliers d'accompagnement à la parentalité",
    })
    .returning();

  const [type2] = await db
    .insert(schema.workshopType)
    .values({
      centreId: centreData.id,
      code: "SPORT_SANTE",
      nom: "Sport et Santé",
      description: "Activités physiques pour la santé",
    })
    .returning();

  const [type3] = await db
    .insert(schema.workshopType)
    .values({
      centreId: centreData.id,
      code: "MEDIATION",
      nom: "Médiation",
      description: "Ateliers de médiation familiale",
    })
    .returning();
  console.log(`  → Workshop types: ${type1.code}, ${type2.code}, ${type3.code}`);

  // Create workshop_role_group + workshop_role_slot
  const [group1] = await db
    .insert(schema.workshopRoleGroup)
    .values({
      workshopTypeId: type1.id,
      label: "Configuration standard",
      ordre: 0,
    })
    .returning();

  await db.insert(schema.workshopRoleSlot).values([
    {
      workshopRoleGroupId: group1.id,
      role: "Psychologue",
      couleur: "#1f3a5f",
      isOptional: false,
      ordre: 0,
    },
    {
      workshopRoleGroupId: group1.id,
      role: "Éducateur",
      couleur: "#2f5d3a",
      isOptional: false,
      ordre: 1,
    },
    {
      workshopRoleGroupId: group1.id,
      role: "Animateur",
      couleur: "#b78a2a",
      isOptional: false,
      ordre: 2,
    },
  ]);

  const [group2] = await db
    .insert(schema.workshopRoleGroup)
    .values({
      workshopTypeId: type2.id,
      label: "Configuration standard",
      ordre: 0,
    })
    .returning();

  await db.insert(schema.workshopRoleSlot).values([
    {
      workshopRoleGroupId: group2.id,
      role: "Coach sportif",
      couleur: "#a64b1f",
      isOptional: false,
      ordre: 0,
    },
    {
      workshopRoleGroupId: group2.id,
      role: "Éducateur sportif",
      couleur: "#7a1f3a",
      isOptional: false,
      ordre: 1,
    },
  ]);

  console.log("  → Workshop role groups: 2 groups, 5 slots created (MEDIATION: 0 group, Option B)");

  // Create workshops
  const [workshop1] = await db
    .insert(schema.workshop)
    .values({
      projectId: project.id,
      typeId: type1.id,
      nom: "Gestion des émotions",
      description: "Atelier parentalité autour de la régulation émotionnelle.",
      seancesCount: 4,
      durationMin: 120,
    })
    .returning();

  const [workshop2] = await db
    .insert(schema.workshop)
    .values({
      projectId: project.id,
      typeId: type2.id,
      nom: "Pratique d'activité physique",
      description: "Activité physique en plein air pour jeunes adolescents.",
      seancesCount: 6,
      durationMin: 90,
    })
    .returning();
  console.log(`  → Workshops: ${workshop1.nom}, ${workshop2.nom}`);

  // Create providers (business entities — not linked to user accounts in V1)
  const [provider1] = await db
    .insert(schema.provider)
    .values({
      nom: "Marie-Laure Cadet",
      email: "ml.cadet@example.gp",
      telephone: "0690 11 22 33",
      ville: "Pointe-à-Pitre",
      specialite: "Psychologie clinicienne",
      bio: "Psychologue clinicienne, 12 ans d'expérience.",
    })
    .returning();

  const [provider2] = await db
    .insert(schema.provider)
    .values({
      nom: "Patrick Ramdine",
      email: "p.ramdine@example.gp",
      telephone: "0690 22 33 44",
      ville: "Le Gosier",
      specialite: "Éducateur sportif",
      bio: "Coach sportif et éducateur sportif diplômé d'État.",
    })
    .returning();
  console.log(`  → Providers: ${provider1.nom}, ${provider2.nom}`);

  console.log("✓ Seed completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
