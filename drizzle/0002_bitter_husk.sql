CREATE TYPE "public"."post_type" AS ENUM('photo', 'event', 'activity');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"association_id" integer NOT NULL,
	"content" text NOT NULL,
	"type" "post_type" DEFAULT 'photo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "follows_unique" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "likes_post_user_unique" ON "likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_case_unique" ON "favorites" USING btree ("user_id","case_id");