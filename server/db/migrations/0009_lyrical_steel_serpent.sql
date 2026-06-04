ALTER TABLE "provider" DROP CONSTRAINT "provider_centre_id_centre_id_fk";
--> statement-breakpoint
DROP INDEX "provider_centre_idx";--> statement-breakpoint
ALTER TABLE "provider" ADD COLUMN "specialite" text;--> statement-breakpoint
ALTER TABLE "provider" DROP COLUMN "centre_id";