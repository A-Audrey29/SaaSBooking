CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "email_log_created_at_idx" ON "email_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_log_recipient_idx" ON "email_log" USING btree ("recipient");--> statement-breakpoint
-- Backfill last_login_at from Better Auth session history (expired sessions are kept in DB).
-- Users with no session row stay NULL (= never logged in, or only sessions deleted by sign-out).
UPDATE "user" u SET "last_login_at" = s.last_created
FROM (SELECT "user_id", MAX("created_at") AS last_created FROM "session" GROUP BY "user_id") s
WHERE s."user_id" = u."id";

-- rollback: DROP TABLE "email_log"; ALTER TABLE "user" DROP COLUMN "last_login_at";
