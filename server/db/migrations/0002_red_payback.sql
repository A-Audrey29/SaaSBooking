ALTER TABLE "session_group" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "session_group" ADD CONSTRAINT "session_group_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_assignment" ADD CONSTRAINT "provider_assignment_unique_per_project" UNIQUE("provider_id","project_id","role");--> statement-breakpoint
ALTER TABLE "provider_role" ADD CONSTRAINT "provider_role_unique_per_type" UNIQUE("workshop_type_id","role");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK (role IN ('super_admin', 'project_admin', 'referent', 'provider'));
-- rollback: ALTER TABLE "user" DROP CONSTRAINT "user_role_check";
--> statement-breakpoint
ALTER TABLE "occurrence" ADD CONSTRAINT "occurrence_statut_check" CHECK (statut IN ('planned', 'confirmed', 'completed', 'cancelled'));
-- rollback: ALTER TABLE "occurrence" DROP CONSTRAINT "occurrence_statut_check";
--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_statut_check" CHECK (statut IN ('empty', 'pending', 'confirmed', 'refused', 'cancelled', 'done', 'skipped'));
-- rollback: ALTER TABLE "ticket" DROP CONSTRAINT "ticket_statut_check";
--> statement-breakpoint
ALTER TABLE "ticket_slot" ADD CONSTRAINT "ticket_slot_statut_check" CHECK (statut IN ('empty', 'pending', 'confirmed', 'refused', 'cancelled', 'done', 'skipped'));
-- rollback: ALTER TABLE "ticket_slot" DROP CONSTRAINT "ticket_slot_statut_check";