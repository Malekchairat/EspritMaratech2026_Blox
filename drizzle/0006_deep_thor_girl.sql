CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'live', 'ended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."membership_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TABLE "meeting_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"association_id" integer NOT NULL,
	"room_name" varchar(255) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"members_only" boolean DEFAULT true NOT NULL,
	"max_participants" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meetings_room_name_unique" UNIQUE("room_name")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"association_id" integer NOT NULL,
	"tier" "membership_tier" DEFAULT 'bronze' NOT NULL,
	"total_donated" integer DEFAULT 0 NOT NULL,
	"membership_status" "membership_status" DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_participant_unique" ON "meeting_participants" USING btree ("meeting_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_user_assoc_unique" ON "memberships" USING btree ("user_id","association_id");