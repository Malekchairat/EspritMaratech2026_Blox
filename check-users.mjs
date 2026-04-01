import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('📋 Checking for all users...\n');

        const result = await sql`
            SELECT id, email, name, role, password_hash FROM users ORDER BY id DESC LIMIT 10
        `;

        if (result.length === 0) {
            console.log('❌ No users found in database');
        } else {
            console.log(`✅ Found ${result.length} users:\n`);
            result.forEach((user, idx) => {
                console.log(`${idx + 1}. ID: ${user.id}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Has Password Hash: ${user.password_hash ? '✅ Yes' : '❌ No'}\n`);
            });
        }
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

main().then(() => process.exit(0));
