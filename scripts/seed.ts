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
      isOptional: false,
      ordre: 0,
    },
    {
      workshopRoleGroupId: group1.id,
      metierId: metierByNom["Éducateur"],
      isOptional: false,
      ordre: 1,
    },
    {
      workshopRoleGroupId: group1.id,
      metierId: metierByNom["Animateur"],
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
      isOptional: false,
      ordre: 0,
    },
    {
      workshopRoleGroupId: group2.id,
      metierId: metierByNom["Éducateur sportif"],
      isOptional: false,
      ordre: 1,
    },
  ]);

  console.log("  → Workshop role groups: 2 groups, 5 slots created (MEDIATION: 0 group, Option B)");

  console.log("  → Workshops: aucun (créés via UI admin)");

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

  // provider2 linked to providerUser (jean.dumont) — métier corrigé : Éducateur (pas Éducateur sportif)
  const [provider2] = await db
    .insert(schema.provider)
    .values({
      userId: providerUser.id,
      nom: "Jean Dumont",
      email: "jean.dumont@provider.dev",
      telephone: "0690 22 33 44",
      ville: "Le Gosier",
      metierId: metierByNom["Éducateur"],
      bio: "Éducateur spécialisé, intervenant en milieu familial.",
    })
    .returning();

  const [provider3] = await db
    .insert(schema.provider)
    .values({
      nom: "Sophie Céleste",
      email: "s.celeste@example.gp",
      telephone: "0690 55 66 77",
      ville: "Baie-Mahault",
      metierId: metierByNom["Animateur"],
      bio: "Animatrice socioculturelle, spécialisée parentalité.",
    })
    .returning();

  console.log(`  → Providers: ${provider1.nom}, ${provider2.nom}, ${provider3.nom}`);

  // ── Disponibilités — semaine courante + suivante ──────────────────────────
  // Créneau conjoint garanti : Mercredi 14h–17h (les 3 disponibles)
  //
  // Marie-Laure (Psychologue) : Lun, Mer, Ven — 9h–12h + 14h–17h
  // Jean Dumont  (Éducateur)  : Mar, Mer, Jeu — 10h–18h
  // Sophie Céleste (Animateur): Lun, Mer, Sam — 14h–18h

  function mondayOf(d: Date): Date {
    const day = d.getDay(); // 0=dim
    const diff = day === 0 ? -6 : 1 - day;
    const m = new Date(d);
    m.setDate(d.getDate() + diff);
    m.setHours(0, 0, 0, 0);
    return m;
  }

  function slot(base: Date, dayOffset: number, startH: number, endH: number): { startAt: Date; endAt: Date } {
    const startAt = new Date(base);
    startAt.setDate(base.getDate() + dayOffset);
    startAt.setHours(startH, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(endH, 0, 0, 0);
    return { startAt, endAt };
  }

  const dispos: { providerId: string; startAt: Date; endAt: Date; kind: string }[] = [];

  for (let week = 0; week < 2; week++) {
    const mon = mondayOf(new Date());
    mon.setDate(mon.getDate() + week * 7);

    // Marie-Laure : Lun(0), Mer(2), Ven(4) — 9h-12h + 14h-17h
    for (const dayOff of [0, 2, 4]) {
      dispos.push({ providerId: provider1.id, kind: "available", ...slot(mon, dayOff, 9, 12) });
      dispos.push({ providerId: provider1.id, kind: "available", ...slot(mon, dayOff, 14, 17) });
    }

    // Jean Dumont : Mar(1), Mer(2), Jeu(3) — 10h-18h
    for (const dayOff of [1, 2, 3]) {
      dispos.push({ providerId: provider2.id, kind: "available", ...slot(mon, dayOff, 10, 18) });
    }

    // Sophie Céleste : Lun(0), Mer(2), Sam(5) — 14h-18h
    for (const dayOff of [0, 2, 5]) {
      dispos.push({ providerId: provider3.id, kind: "available", ...slot(mon, dayOff, 14, 18) });
    }
  }

  await db.insert(schema.providerAvailability).values(
    dispos.map((d) => ({ ...d, id: crypto.randomUUID() }))
  );
  console.log(`  → Disponibilités: ${dispos.length} créneaux insérés (créneau conjoint: Mercredi 14h–17h)`);

  console.log("  → Session groups: aucun (créés via UI référent)");

  console.log("✓ Seed completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
