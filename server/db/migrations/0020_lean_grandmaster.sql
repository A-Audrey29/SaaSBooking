CREATE TABLE "project_centre" (
	"project_id" uuid NOT NULL,
	"centre_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_centre_project_id_centre_id_pk" PRIMARY KEY("project_id","centre_id")
);
--> statement-breakpoint
ALTER TABLE "project_centre" ADD CONSTRAINT "project_centre_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_centre" ADD CONSTRAINT "project_centre_centre_id_centre_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "centre_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_centre_id_fkey";
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_centre_id_centre_id_fk";--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_centre_id_centre_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centre"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "project_centre" ("project_id", "centre_id") SELECT "id", "centre_id" FROM "project" WHERE "centre_id" IS NOT NULL ON CONFLICT DO NOTHING;
