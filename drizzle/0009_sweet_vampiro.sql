CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TABLE "impact_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"scenario" text NOT NULL,
	"sentiment" "sentiment" NOT NULL,
	"bias_score" integer DEFAULT 0 NOT NULL,
	"cluster_id" integer,
	"metadata" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
