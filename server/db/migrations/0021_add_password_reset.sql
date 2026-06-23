CREATE TABLE "password_reset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "password_reset_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "password_reset" ADD CONSTRAINT "password_reset_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

-- rollback: DROP TABLE "password_reset";
