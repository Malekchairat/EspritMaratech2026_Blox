CREATE TYPE "public"."influencer_type" AS ENUM('influencer', 'sponsor');--> statement-breakpoint
CREATE TABLE "influencer_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"influencer_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "influencers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "influencer_type" DEFAULT 'influencer' NOT NULL,
	"photo" text,
	"social_links" text,
	"solidarity_message" text,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "influencer_case_unique" ON "influencer_cases" USING btree ("influencer_id","case_id");