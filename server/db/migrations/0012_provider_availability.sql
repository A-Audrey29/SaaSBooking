-- Migration 0012 : table provider_availability
-- Sémantique : prestataire disponible sur [start_at, end_at]
-- Chevauchements non contraints en V1 (BDR-008)
-- rollback: DROP TABLE IF EXISTS "provider_availability";

CREATE TABLE "provider_availability" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider_id" uuid NOT NULL REFERENCES "provider"("id") ON DELETE CASCADE,
  "start_at"    timestamptz NOT NULL,
  "end_at"      timestamptz NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  "deleted_at"  timestamptz
);

CREATE INDEX "provider_availability_provider_idx" ON "provider_availability"("provider_id");
CREATE INDEX "provider_availability_start_at_idx" ON "provider_availability"("start_at");
