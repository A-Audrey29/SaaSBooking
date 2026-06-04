-- Migration 0011 : lien provider ↔ user (userId FK UNIQUE sur provider)
-- rollback: ALTER TABLE "provider" DROP COLUMN "user_id";

ALTER TABLE "provider" ADD COLUMN "user_id" uuid UNIQUE REFERENCES "user"("id") ON DELETE SET NULL;
