ALTER TABLE "occurrence" ADD COLUMN "workshop_role_group_id" uuid;--> statement-breakpoint
ALTER TABLE "ticket_slot" ADD COLUMN "workshop_role_slot_id" uuid;--> statement-breakpoint
ALTER TABLE "workshop_type" ADD COLUMN "centre_id" uuid;--> statement-breakpoint
ALTER TABLE "workshop_type" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workshop_type" ADD CONSTRAINT "workshop_type_centre_id_centre_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centre"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workshop_type_centre_idx" ON "workshop_type" USING btree ("centre_id");