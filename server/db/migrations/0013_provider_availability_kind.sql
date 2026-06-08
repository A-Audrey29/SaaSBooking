-- Custom SQL migration file, put your code below! --
-- Migration 0013 : ajout colonne "kind" sur provider_availability
-- Permet de distinguer disponibilité positive ('available') d'une exception déclarée ('unavailable').
-- Vérifié avant migration : 48 lignes actives, toutes sémantiquement 'available' → DEFAULT backfill safe.
-- rollback: ALTER TABLE "provider_availability" DROP CONSTRAINT IF EXISTS "provider_availability_kind_check"; ALTER TABLE "provider_availability" DROP COLUMN IF EXISTS "kind";

ALTER TABLE "provider_availability"
  ADD COLUMN "kind" text NOT NULL DEFAULT 'available';

ALTER TABLE "provider_availability"
  ADD CONSTRAINT "provider_availability_kind_check"
  CHECK ("kind" IN ('available', 'unavailable'));
