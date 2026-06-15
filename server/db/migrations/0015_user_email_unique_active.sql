-- Permet de recréer un user avec le même email après soft delete.
-- L'ancienne contrainte UNIQUE(email) bloquait toute réutilisation
-- d'un email appartenant à un user soft-deleted (deleted_at IS NOT NULL).
--
-- Migration manuelle (LRN-012) : appliquée via script tsx, pas par
-- drizzle-kit migrate (pas de snapshot meta correspondant).

ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";

CREATE UNIQUE INDEX "user_email_unique_active" ON "user" ("email") WHERE "deleted_at" IS NULL;

-- rollback:
-- DROP INDEX "user_email_unique_active";
-- ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE ("email");
