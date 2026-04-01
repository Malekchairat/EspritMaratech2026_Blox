
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found in .env");
        process.exit(1);
    }

    const sql = neon(url);

    try {
        const email = 'malek.chairat@esprit.tn';
        console.log(`Checking user: ${email}`);

        const result = await sql('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);

        if (result.length === 0) {
            console.log("User not found.");

            // Also check all users to see what's in there
            console.log("\nRecent users:");
            const allUsers = await sql('SELECT id, name, email, role FROM users ORDER BY id DESC LIMIT 5');
            console.log(JSON.stringify(allUsers, null, 2));

        } else {
            console.log("User found:");
            console.log(JSON.stringify(result[0], null, 2));
        }
    } catch (error) {
        console.error("Database error:", error);
    }
}

main();
