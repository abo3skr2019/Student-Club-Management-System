ALTER TABLE "image" DROP CONSTRAINT "drizzle_image_uuid_unique";--> statement-breakpoint
ALTER TABLE "image" DROP CONSTRAINT "image_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "image" DROP CONSTRAINT "image_updated_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "uuid" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "uuid" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "image" DROP COLUMN "is_archived";--> statement-breakpoint
ALTER TABLE "image" DROP COLUMN "archived_at";--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_uuid_unique" UNIQUE("uuid");