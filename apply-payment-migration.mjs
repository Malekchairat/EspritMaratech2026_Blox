import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function applyMigration() {
  try {
    console.log("Creating payment_status enum...");
    try {
      await sql`CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded')`;
      console.log("✓ payment_status enum created");
    } catch (err) {
      if (err.message && err.message.includes("already exists")) {
        console.log("✓ payment_status enum already exists (skipping)");
      } else {
        throw err;
      }
    }

    console.log("\nCreating payments table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "payments" (
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
      )
    `;
    console.log("✓ payments table created\n");

    // Verify the table was created
    const result = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'payments'
    `;

    if (result.length > 0) {
      console.log("✅ Migration successful! Payments table is ready.");
    } else {
      console.log("❌ Table creation might have failed. Please check manually.");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

applyMigration();
