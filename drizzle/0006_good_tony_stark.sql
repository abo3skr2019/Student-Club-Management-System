DROP INDEX IF EXISTS "role_idx";--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "tag" text;--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "submitting_errors" serial DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "created_by" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "updated_by" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "club_membership" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_membership_role_idx" ON "club_membership" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_membership_status_idx" ON "club_membership" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_membership_is_archived_idx" ON "club_membership" ("is_archived");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "club_membership" ADD CONSTRAINT "drizzle_club_membership_uuid_unique" UNIQUE("uuid");