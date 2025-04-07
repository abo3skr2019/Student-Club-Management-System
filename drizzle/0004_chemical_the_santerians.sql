ALTER TABLE "user" ADD COLUMN "uni_id" varchar(9);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_uni_id_unique" UNIQUE("uni_id");