CREATE TYPE "public"."category" AS ENUM('health', 'disability', 'children', 'education', 'renovation', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('donor', 'association', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TABLE "case_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"photo_key" varchar(500) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"view_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" "category" NOT NULL,
	"cha9a9a_link" varchar(500) NOT NULL,
	"target_amount" integer NOT NULL,
	"current_amount" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"association_id" integer NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"donor_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"location" varchar(255),
	"image_url" text,
	"image_key" varchar(500),
	"association_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"password_hash" varchar(255),
	"login_method" varchar(64),
	"role" "role" DEFAULT 'donor' NOT NULL,
	"phone" varchar(20),
	"avatar" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
