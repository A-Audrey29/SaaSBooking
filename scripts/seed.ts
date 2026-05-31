import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback on .env

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashPassword } from "better-auth/crypto";
import * as schema from "../server/db/schema";

// DEV ONLY — never use in prod. Seed users only.
const DEV_PASSWORD = "dev_seed_2026";

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
  await db.delete(schema.providerRole);
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
      nom: "Centre social des Abymes",
      adresse: "12 rue de la Paix, 97139 Les Abymes",
      ville: "Les Abymes",
      timezone: "America/Guadeloupe",
      telephone: "0590 12 34 56",
      email: "contact@cs-abymes.gp",
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
      email: "jean.dumont@cs-abymes.gp",
      name: "Jean Dumont",
      role: "provider",
      centreId: centreData.id,
    })
    .returning();
  console.log(`  → Provider user: ${providerUser.email}`);

  // Create account records so Better Auth can authenticate these users
  const hashedPassword = await hashPassword(DEV_PASSWORD);
  await db.insert(schema.account).values([
    {
      accountId: superAdmin.email,
      providerId: "credential",
      userId: superAdmin.id,
      password: hashedPassword,
    },
    {
      accountId: referent1.email,
      providerId: "credential",
      userId: referent1.id,
      password: hashedPassword,
    },
    {
      accountId: referent2.email,
      providerId: "credential",
      userId: referent2.id,
      password: hashedPassword,
    },
    {
      accountId: providerUser.email,
      providerId: "credential",
      userId: providerUser.id,
      password: hashedPassword,
    },
  ]);
  console.log("  → Account records created");

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

  // Create workshop types
  const [type1] = await db
    .insert(schema.workshopType)
    .values({
      code: "PARENTALITE",
      nom: "Parentalité",
      description: "Ateliers d'accompagnement à la parentalité",
    })
    .returning();

  const [type2] = await db
    .insert(schema.workshopType)
    .values({
      code: "SPORT_SANTE",
      nom: "Sport et Santé",
      description: "Activités physiques pour la santé",
    })
    .returning();

  const [type3] = await db
    .insert(schema.workshopType)
    .values({
      code: "MEDIATION",
      nom: "Médiation",
      description: "Ateliers de médiation familiale",
    })
    .returning();
  console.log(`  → Workshop types: ${type1.code}, ${type2.code}, ${type3.code}`);

  // Create provider roles
  await db.insert(schema.providerRole).values([
    { workshopTypeId: type1.id, role: "Psychologue", couleur: "#1f3a5f", ordre: 0 },
    { workshopTypeId: type1.id, role: "Éducateur", couleur: "#2f5d3a", ordre: 1 },
    { workshopTypeId: type1.id, role: "Animateur", couleur: "#b78a2a", ordre: 2 },
    { workshopTypeId: type2.id, role: "Coach sportif", couleur: "#a64b1f", ordre: 0 },
    { workshopTypeId: type2.id, role: "Éducateur sportif", couleur: "#7a1f3a", ordre: 1 },
  ]);
  console.log("  → Provider roles created");

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
      centreId: centreData.id,
      nom: "Marie-Laure Cadet",
      email: "ml.cadet@example.gp",
      telephone: "0690 11 22 33",
      ville: "Pointe-à-Pitre",
      bio: "Psychologue clinicienne, 12 ans d'expérience.",
    })
    .returning();

  const [provider2] = await db
    .insert(schema.provider)
    .values({
      centreId: centreData.id,
      nom: "Patrick Ramdine",
      email: "p.ramdine@example.gp",
      telephone: "0690 22 33 44",
      ville: "Le Gosier",
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
