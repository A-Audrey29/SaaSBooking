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

const DEV_PASSWORD = "dev_seed_2026";

async function createCredentialAccount(db: ReturnType<typeof drizzle>, userId: string, email: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { hashPassword } = await import("../node_modules/better-auth/dist/crypto/index.mjs") as any;
  const hashed = await hashPassword(DEV_PASSWORD);
  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: email,
    providerId: "credential",
    userId,
    password: hashed,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

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
  await db.delete(schema.metier);
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
  await createCredentialAccount(db, superAdmin.id, superAdmin.email);
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
  await createCredentialAccount(db, referent1.id, referent1.email);
  await createCredentialAccount(db, referent2.id, referent2.email);
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
  await createCredentialAccount(db, providerUser.id, providerUser.email);
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

  // Create metiers (reference table)
  const metierNames = ["Psychologue", "Éducateur", "Animateur", "Coach sportif", "Éducateur sportif"];
  const metierRows = await db
    .insert(schema.metier)
    .values(metierNames.map((nom) => ({ nom })))
    .returning();
  const metierByNom = Object.fromEntries(metierRows.map((m) => [m.nom, m.id]));
  console.log(`  → Métiers: ${metierNames.join(", ")}`);

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
      metierId: metierByNom["Psychologue"],
      couleur: "#1f3a5f",
      isOptional: false,
      ordre: 0,
    },
    {
      workshopRoleGroupId: group1.id,
      metierId: metierByNom["Éducateur"],
      couleur: "#2f5d3a",
      isOptional: false,
      ordre: 1,
    },
    {
      workshopRoleGroupId: group1.id,
      metierId: metierByNom["Animateur"],
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
      metierId: metierByNom["Coach sportif"],
      couleur: "#a64b1f",
      isOptional: false,
      ordre: 0,
    },
    {
      workshopRoleGroupId: group2.id,
      metierId: metierByNom["Éducateur sportif"],
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

  // Create providers
  const [provider1] = await db
    .insert(schema.provider)
    .values({
      nom: "Marie-Laure Cadet",
      email: "ml.cadet@example.gp",
      telephone: "0690 11 22 33",
      ville: "Pointe-à-Pitre",
      metierId: metierByNom["Psychologue"],
      bio: "Psychologue clinicienne, 12 ans d'expérience.",
    })
    .returning();

  // provider2 linked to providerUser (jean.dumont) via BDR-010
  const [provider2] = await db
    .insert(schema.provider)
    .values({
      userId: providerUser.id,
      nom: "Jean Dumont",
      email: "jean.dumont@provider.dev",
      telephone: "0690 22 33 44",
      ville: "Le Gosier",
      metierId: metierByNom["Éducateur sportif"],
      bio: "Coach sportif et éducateur sportif diplômé d'État.",
    })
    .returning();
  console.log(`  → Providers: ${provider1.nom}, ${provider2.nom} (lié user: ${providerUser.email})`);

  // Create session_group + occurrences with dates around today for calendar testing
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function nextWeekday(base: Date, offsetDays: number, hour = 9): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  const [sg1] = await db
    .insert(schema.sessionGroup)
    .values({
      workshopId: workshop1.id,
      centreId: centreData.id,
      nom: "Groupe Parents — Émotions",
      audience: "8 parents",
      createdBy: referent1.id,
    })
    .returning();

  const occurrences1 = [
    { index: 1, offsetDays: 1, duration: 120 },
    { index: 2, offsetDays: 8, duration: 120 },
    { index: 3, offsetDays: 15, duration: 120 },
    { index: 4, offsetDays: 22, duration: 120 },
  ];

  for (const occ of occurrences1) {
    const startAt = nextWeekday(today, occ.offsetDays, 9);
    const endAt = new Date(startAt.getTime() + occ.duration * 60_000);
    await db.insert(schema.occurrence).values({
      sessionGroupId: sg1.id,
      index: occ.index,
      startAt,
      endAt,
      statut: "planned",
      workshopRoleGroupId: group1.id,
    });
  }

  const [sg2] = await db
    .insert(schema.sessionGroup)
    .values({
      workshopId: workshop2.id,
      centreId: centreData.id,
      nom: "Groupe Ados — Sport",
      audience: "12 ados 14-16 ans",
      createdBy: referent1.id,
    })
    .returning();

  const occurrences2 = [
    { index: 1, offsetDays: 2, duration: 90 },
    { index: 2, offsetDays: 9, duration: 90 },
    { index: 3, offsetDays: 16, duration: 90 },
  ];

  for (const occ of occurrences2) {
    const startAt = nextWeekday(today, occ.offsetDays, 14);
    const endAt = new Date(startAt.getTime() + occ.duration * 60_000);
    await db.insert(schema.occurrence).values({
      sessionGroupId: sg2.id,
      index: occ.index,
      startAt,
      endAt,
      statut: "planned",
      workshopRoleGroupId: group2.id,
    });
  }

  console.log(`  → Session groups: ${sg1.nom}, ${sg2.nom} (7 occurrences)`);

  console.log("✓ Seed completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
