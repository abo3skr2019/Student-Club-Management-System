CREATE TABLE IF NOT EXISTS "club" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500) NOT NULL,
	"logo" varchar(4096) NOT NULL,
	"supervisor_id" integer NOT NULL,
	"type" text NOT NULL,
	"founding_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_club_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "club_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "club_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"club_id" integer NOT NULL,
	"role" varchar(15) DEFAULT 'member' NOT NULL,
	"tag" varchar(50),
	"status" varchar(10) DEFAULT 'pending' NOT NULL,
	"submitting_errors" integer DEFAULT 0 NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "drizzle_club_membership_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"poster" varchar(4096) NOT NULL,
	"location" varchar(255) NOT NULL,
	"registration_start" timestamp NOT NULL,
	"registration_end" timestamp NOT NULL,
	"event_start" timestamp NOT NULL,
	"event_end" timestamp NOT NULL,
	"seats_available" integer NOT NULL,
	"category" varchar(20) NOT NULL,
	"club_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_event_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_registration" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"uni_id" varchar(9),
	"national_id" varchar(10) NOT NULL,
	"phone_number" varchar(10) NOT NULL,
	"display_name" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text NOT NULL,
	"profile_image" text NOT NULL,
	"providers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"global_role" text DEFAULT 'user' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_user_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "user_uni_id_unique" UNIQUE("uni_id"),
	CONSTRAINT "user_national_id_unique" UNIQUE("national_id"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'low' NOT NULL,
	"category" text DEFAULT 'bug' NOT NULL,
	"assigned_to" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_ticket_uuid_unique" UNIQUE("uuid")
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
CREATE INDEX IF NOT EXISTS "club_status_idx" ON "club" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_is_archived_idx" ON "club" ("is_archived");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_club_idx" ON "club_membership" ("user_id","club_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_membership_role_idx" ON "club_membership" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_membership_status_idx" ON "club_membership" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_membership_club_idx" ON "club_membership" ("club_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_membership_is_archived_idx" ON "club_membership" ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_id_idx" ON "event" ("club_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_category_idx" ON "event" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_start_idx" ON "event" ("event_start");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_event_idx" ON "event_registration" ("user_id","event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_registration_status_idx" ON "event_registration" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_registration_event_idx" ON "event_registration" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "global_role_idx" ON "user" ("global_role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_idx" ON "user" ("providers");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_is_archived_idx" ON "user" ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_idx" ON "ticket" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "priority_idx" ON "ticket" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_club_membership_idx" ON "task" ("club_membership_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_status_idx" ON "task" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_is_archived_idx" ON "task" ("is_archived");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club" ADD CONSTRAINT "club_supervisor_id_user_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket" ADD CONSTRAINT "ticket_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
