ALTER TABLE "ticket" ALTER COLUMN "created_by" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ticket" ALTER COLUMN "created_by" DROP NOT NULL;