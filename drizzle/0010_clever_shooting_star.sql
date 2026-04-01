CREATE TYPE "public"."notification_type" AS ENUM('new_post', 'new_case', 'new_meeting', 'membership_approved', 'membership_rejected', 'case_approved', 'case_rejected', 'post_liked', 'post_commented', 'new_follower');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"link" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"actor_id" integer,
	"actor_name" varchar(255),
	"actor_avatar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
