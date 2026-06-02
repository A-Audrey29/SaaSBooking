CREATE TABLE "workshop_role_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_type_id" uuid NOT NULL,
	"label" text NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workshop_role_slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_role_group_id" uuid NOT NULL,
	"role" text NOT NULL,
	"couleur" text,
	"is_optional" boolean DEFAULT false NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "workshop_role_group" ADD CONSTRAINT "workshop_role_group_workshop_type_id_workshop_type_id_fk" FOREIGN KEY ("workshop_type_id") REFERENCES "public"."workshop_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_role_slot" ADD CONSTRAINT "workshop_role_slot_workshop_role_group_id_workshop_role_group_id_fk" FOREIGN KEY ("workshop_role_group_id") REFERENCES "public"."workshop_role_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workshop_role_group_workshop_type_idx" ON "workshop_role_group" USING btree ("workshop_type_id");--> statement-breakpoint
CREATE INDEX "workshop_role_slot_workshop_role_group_idx" ON "workshop_role_slot" USING btree ("workshop_role_group_id");--> statement-breakpoint
ALTER TABLE "occurrence" ADD CONSTRAINT "occurrence_workshop_role_group_id_workshop_role_group_id_fk" FOREIGN KEY ("workshop_role_group_id") REFERENCES "public"."workshop_role_group"("id") ON DELETE set null ON UPDATE no action;