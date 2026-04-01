import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function testLogin() {
    try {
        const email = 'donor@blox.com';
        const password = 'Donor123!';
        
        console.log('🔍 Testing login flow step by step...\n');
        
        // Step 1: Query user
        console.log(`1️⃣ Querying user with email: ${email}`);
        const result = await sql`
            SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
        `;
        console.log(`   Result length: ${result.length}`);
        
        if (result.length === 0) {
            console.log(`   ❌ USER NOT FOUND!\n`);
            return;
        }
        
        const user = result[0];
        console.log(`   ✅ Found user:`);
        console.log(`      - ID: ${user.id}`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - Name: ${user.name}`);
        console.log(`      - Has password hash: ${!!user.password_hash}\n`);
        
        // Step 2: Check password
        console.log(`2️⃣ Verifying password`);
        if (!user.password_hash) {
            console.log(`   ❌ NO PASSWORD HASH FOUND!\n`);
            return;
        }
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log(`   ✅ Password match: ${isValid}\n`);
        
        if (isValid) {
            console.log('✅ ✅ ✅ LOGIN SHOULD WORK! ✅ ✅ ✅');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

await testLogin();
process.exit(0);
