CREATE TABLE "image" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"purpose" varchar(50) DEFAULT 'general' NOT NULL,
	"hash" varchar(64) NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drizzle_image_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
DROP INDEX "user_club_idx";--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "seats_remaining" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "status" varchar(20) DEFAULT 'upcoming' NOT NULL;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_hash_idx" ON "image" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "image_purpose_idx" ON "image" USING btree ("purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "user_club_idx" ON "club_membership" USING btree ("user_id","club_id") WHERE "club_membership"."is_archived" = false;