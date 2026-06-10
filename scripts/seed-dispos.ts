/**
 * seed-dispos.mts
 * Ajoute des disponibilités de test pour tous les prestataires existants
 * + un prestataire Animateur manquant.
 * Idempotent : supprime les dispos existantes avant de réinsérer.
 * Ne touche pas aux users, centres, ateliers, séances.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull, and } from "drizzle-orm";
import * as schema from "../server/db/schema";

if (process.env.NODE_ENV === "production") {
  throw new Error("Seed script refuses to run in production");
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

/** Génère des créneaux hebdomadaires récurrents sur N semaines à partir d'aujourd'hui. */
function weeklySlots(
  providerId: string,
  dowPattern: number[], // 0=lun, 1=mar ... 6=dim
  timeRanges: { start: number; end: number }[], // heures locales (UTC-4 Guadeloupe = UTC+0-4)
  weeksCount = 4
): (typeof schema.providerAvailability.$inferInsert)[] {
  const slots: (typeof schema.providerAvailability.$inferInsert)[] = [];
  const today = new Date();
  // Lundi de la semaine courante
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  for (let week = 0; week < weeksCount; week++) {
    for (const dow of dowPattern) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + week * 7 + dow);
      for (const range of timeRanges) {
        const startAt = new Date(date);
        startAt.setHours(range.start, 0, 0, 0);
        const endAt = new Date(date);
        endAt.setHours(range.end, 0, 0, 0);
        slots.push({ providerId, startAt, endAt, kind: "available" });
      }
    }
  }
  return slots;
}

async function main() {
  console.log("→ Seeding disponibilités prestataires...");

  // 1. Récupérer les prestataires + métiers existants
  const providers = await db
    .select({
      id: schema.provider.id,
      nom: schema.provider.nom,
      metierNom: schema.metier.nom,
    })
    .from(schema.provider)
    .innerJoin(schema.metier, eq(schema.provider.metierId, schema.metier.id))
    .where(isNull(schema.provider.deletedAt));

  console.log(`  → Prestataires existants: ${providers.map((p) => `${p.nom} (${p.metierNom})`).join(", ")}`);

  // 2. Vérifier si un Animateur prestataire existe
  const [animateurMetier] = await db
    .select({ id: schema.metier.id })
    .from(schema.metier)
    .where(and(eq(schema.metier.nom, "Animateur"), isNull(schema.metier.deletedAt)))
    .limit(1);

  const animateurProvider = providers.find((p) => p.metierNom === "Animateur");

  if (!animateurProvider && animateurMetier) {
    const [newProv] = await db
      .insert(schema.provider)
      .values({
        nom: "Sophie Lacroix",
        email: "sophie.lacroix@example.gp",
        telephone: "0690 44 55 66",
        ville: "Baie-Mahault",
        metierId: animateurMetier.id,
        bio: "Animatrice socio-culturelle, spécialiste ateliers jeunesse.",
      })
      .returning({ id: schema.provider.id, nom: schema.provider.nom });
    providers.push({ id: newProv.id, nom: newProv.nom, metierNom: "Animateur" });
    console.log(`  → Prestataire Animateur créé: ${newProv.nom}`);
  }

  // 3. Supprimer les dispos existantes (hors production)
  for (const p of providers) {
    await db
      .delete(schema.providerAvailability)
      .where(eq(schema.providerAvailability.providerId, p.id));
  }
  console.log("  → Dispos existantes supprimées");

  // 4. Insérer les dispos par prestataire
  const disposByMetier: Record<string, (typeof schema.providerAvailability.$inferInsert)[]> = {};

  for (const p of providers) {
    if (p.metierNom === "Psychologue") {
      // Marie-Laure : lun + mer + ven, 9h-12h et 14h-17h
      disposByMetier[p.id] = weeklySlots(
        p.id,
        [0, 2, 4],
        [{ start: 9, end: 12 }, { start: 14, end: 17 }],
        4
      );
    } else if (p.metierNom === "Éducateur sportif") {
      // Jean Dumont : mar + jeu + sam, 9h-12h et 14h-18h
      disposByMetier[p.id] = weeklySlots(
        p.id,
        [1, 3, 5],
        [{ start: 9, end: 12 }, { start: 14, end: 18 }],
        4
      );
    } else if (p.metierNom === "Animateur") {
      // Sophie Lacroix : lun-ven, 8h-12h
      disposByMetier[p.id] = weeklySlots(
        p.id,
        [0, 1, 2, 3, 4],
        [{ start: 8, end: 12 }, { start: 13, end: 16 }],
        4
      );
    }
  }

  let totalSlots = 0;
  for (const [providerId, slots] of Object.entries(disposByMetier)) {
    if (slots.length === 0) continue;
    await db.insert(schema.providerAvailability).values(slots);
    const p = providers.find((x) => x.id === providerId)!;
    console.log(`  → ${p.nom} (${p.metierNom}) : ${slots.length} créneaux insérés`);
    totalSlots += slots.length;
  }

  console.log(`✓ Seed dispos terminé — ${totalSlots} créneaux au total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
