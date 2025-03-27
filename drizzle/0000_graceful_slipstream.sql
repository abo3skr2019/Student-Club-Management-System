CREATE TABLE IF NOT EXISTS "club" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500) NOT NULL,
	"logo" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_club_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "club_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"poster" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"registration_start" timestamp NOT NULL,
	"registration_end" timestamp NOT NULL,
	"event_start" timestamp NOT NULL,
	"event_end" timestamp NOT NULL,
	"seats_available" integer NOT NULL,
	"seats_remaining" integer NOT NULL,
	"category" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'upcoming' NOT NULL,
	"club_id" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_event_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "club_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"club_id" serial NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text NOT NULL,
	"profile_image" text NOT NULL,
	"providers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"global_role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_user_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_event_joined" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"event_id" serial NOT NULL,
	"registration_date" timestamp DEFAULT now() NOT NULL
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
	"assigned_to" serial NOT NULL,
	"created_by" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_ticket_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "club" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_id_idx" ON "event" ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_club_idx" ON "club_membership" ("user_id","club_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_idx" ON "club_membership" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_idx" ON "user" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "global_role_idx" ON "user" ("global_role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_idx" ON "user" ("providers");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_event_idx" ON "user_event_joined" ("user_id","event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_idx" ON "ticket" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "priority_idx" ON "ticket" ("priority");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_club_id_club_id_fk" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "user_event_joined" ADD CONSTRAINT "user_event_joined_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_event_joined" ADD CONSTRAINT "user_event_joined_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE cascade ON UPDATE no action;
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
