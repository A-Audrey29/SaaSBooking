-- workshop.centre_id nullable : catalogue d'ateliers partagé.
-- NULL = atelier global créé par l'admin, visible par tous les centres.
-- non-NULL = atelier privé du centre. Voir BDR-022.
--
-- Migration manuelle (LRN-012) : appliquée via script tsx, pas par
-- drizzle-kit migrate (pas de snapshot meta correspondant).

ALTER TABLE "workshop" ADD COLUMN "centre_id" uuid REFERENCES "centre"("id") ON DELETE SET NULL;
CREATE INDEX "workshop_centre_idx" ON "workshop" ("centre_id");

-- rollback:
-- DROP INDEX IF EXISTS "workshop_centre_idx";
-- ALTER TABLE "workshop" DROP COLUMN "centre_id";
