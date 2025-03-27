ALTER TABLE "ticket" ALTER COLUMN "assigned_to" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ticket" ALTER COLUMN "assigned_to" DROP NOT NULL;