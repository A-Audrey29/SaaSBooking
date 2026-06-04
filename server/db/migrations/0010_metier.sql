-- Migration 0010 : table metier + migration FK (specialite/role → metier_id)
-- rollback: voir bas de fichier

-- 1. Créer table metier
CREATE TABLE "metier" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nom" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz
);
CREATE INDEX "metier_nom_idx" ON "metier" ("nom");

-- 2. Seed métiers depuis workshop_role_slot.role existants
-- Données connues : ['Psychologue', 'Éducateur', 'Animateur', 'Coach sportif', 'Éducateur sportif']
-- provider.specialite = 'Psychologue enfant' mappe sur 'Psychologue' (déjà présent dans le SELECT DISTINCT)
INSERT INTO "metier" ("nom")
SELECT DISTINCT "role" FROM "workshop_role_slot";

-- 3. Ajouter colonnes FK nullable (transition)
ALTER TABLE "workshop_role_slot" ADD COLUMN "metier_id" uuid REFERENCES "metier"("id") ON DELETE RESTRICT;
ALTER TABLE "provider" ADD COLUMN "metier_id" uuid REFERENCES "metier"("id") ON DELETE RESTRICT;
ALTER TABLE "provider_assignment" ADD COLUMN "metier_id" uuid REFERENCES "metier"("id") ON DELETE RESTRICT;

-- 4. Peupler les FK
UPDATE "workshop_role_slot" wrs
SET "metier_id" = m.id
FROM "metier" m
WHERE m.nom = wrs.role;

UPDATE "provider" p
SET "metier_id" = m.id
FROM "metier" m
WHERE m.nom = 'Psychologue'
  AND p.specialite = 'Psychologue enfant';

-- provider_assignment.role est vide (0 lignes actives) — pas d'UPDATE nécessaire

-- 5. Passer workshop_role_slot.metier_id NOT NULL (toutes lignes peuplées)
ALTER TABLE "workshop_role_slot" ALTER COLUMN "metier_id" SET NOT NULL;

-- 6. Passer provider_assignment.metier_id NOT NULL (table vide, aucun risque)
ALTER TABLE "provider_assignment" ALTER COLUMN "metier_id" SET NOT NULL;

-- 7. Recréer la contrainte UNIQUE sur provider_assignment avec metier_id
ALTER TABLE "provider_assignment" DROP CONSTRAINT "provider_assignment_unique_per_project";
ALTER TABLE "provider_assignment" ADD CONSTRAINT "provider_assignment_unique_per_project"
  UNIQUE (provider_id, project_id, metier_id);

-- 8. Supprimer les anciennes colonnes texte
ALTER TABLE "workshop_role_slot" DROP COLUMN "role";
ALTER TABLE "provider" DROP COLUMN "specialite";
ALTER TABLE "provider_assignment" DROP COLUMN "role";

-- rollback:
-- ALTER TABLE "provider_assignment" ADD COLUMN "role" text;
-- ALTER TABLE "provider" ADD COLUMN "specialite" text;
-- ALTER TABLE "workshop_role_slot" ADD COLUMN "role" text;
-- UPDATE workshop_role_slot wrs SET role = m.nom FROM metier m WHERE m.id = wrs.metier_id;
-- UPDATE provider p SET specialite = 'Psychologue enfant' FROM metier m WHERE m.id = p.metier_id AND m.nom = 'Psychologue';
-- UPDATE provider_assignment pa SET role = m.nom FROM metier m WHERE m.id = pa.metier_id;
-- ALTER TABLE "provider_assignment" DROP CONSTRAINT "provider_assignment_unique_per_project";
-- ALTER TABLE "provider_assignment" ADD CONSTRAINT "provider_assignment_unique_per_project" UNIQUE (provider_id, project_id, role);
-- ALTER TABLE "workshop_role_slot" DROP COLUMN "metier_id";
-- ALTER TABLE "provider" DROP COLUMN "metier_id";
-- ALTER TABLE "provider_assignment" DROP COLUMN "metier_id";
-- DROP TABLE "metier";
