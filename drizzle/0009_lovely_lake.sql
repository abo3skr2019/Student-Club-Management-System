CREATE TABLE IF NOT EXISTS "supervisor" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone_number" varchar(10) NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_supervisor_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"club_membership_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar(500) NOT NULL,
	"volunteered_seconds" integer NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attachment" varchar(4096),
	"review_comment" varchar(500),
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_task_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
ALTER TABLE "club" ALTER COLUMN "created_by" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "club" ALTER COLUMN "updated_by" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "club_membership" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "club_membership" ALTER COLUMN "club_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "club_membership" ALTER COLUMN "submitting_errors" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "club_membership" ALTER COLUMN "created_by" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "club_membership" ALTER COLUMN "updated_by" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "club" ADD COLUMN "supervisor_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "national_id" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supervisor_name_idx" ON "supervisor" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supervisor_is_archived_idx" ON "supervisor" ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_club_membership_idx" ON "task" ("club_membership_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_status_idx" ON "task" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_is_archived_idx" ON "task" ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_is_archived_idx" ON "user" ("is_archived");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club" ADD CONSTRAINT "club_supervisor_id_supervisor_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "supervisor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "club" DROP COLUMN IF EXISTS "supervisor_name";--> statement-breakpoint
ALTER TABLE "club" DROP COLUMN IF EXISTS "supervisor_phone_number";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task" ADD CONSTRAINT "task_club_membership_id_club_membership_id_fk" FOREIGN KEY ("club_membership_id") REFERENCES "club_membership"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task" ADD CONSTRAINT "task_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task" ADD CONSTRAINT "task_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_national_id_unique" UNIQUE("national_id");