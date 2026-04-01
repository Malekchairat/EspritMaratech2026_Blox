CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"donor_id" integer,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'flousi' NOT NULL,
	"transaction_id" varchar(255),
	"payment_url" text,
	"metadata" text,
	"error_message" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
