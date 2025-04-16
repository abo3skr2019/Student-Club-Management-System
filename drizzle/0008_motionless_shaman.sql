ALTER TABLE "club" ADD COLUMN "supervisor_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "supervisor_phone_number" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "founding_date" date;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "created_by" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "updated_by" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_status_idx" ON "club" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_is_archived_idx" ON "club" ("is_archived");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club" ADD CONSTRAINT "club_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club" ADD CONSTRAINT "club_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
