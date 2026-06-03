CREATE TABLE "user_invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "centre_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password_set" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_invitation" ADD CONSTRAINT "user_invitation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;