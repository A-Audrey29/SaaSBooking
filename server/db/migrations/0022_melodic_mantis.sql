ALTER TABLE "user" ADD COLUMN "cgu_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cgu_version" text;

-- rollback: ALTER TABLE "user" DROP COLUMN "cgu_accepted_at", DROP COLUMN "cgu_version";