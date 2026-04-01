import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('🔐 Testing password verification...\n');

        const user = await sql`SELECT * FROM users WHERE email = 'donor@blox.com'`;
        
        if (user.length === 0) {
            console.log('❌ User not found');
            return;
        }

        const userData = user[0];
        console.log(`✅ Found user: ${userData.email}`);
        console.log(`   Password Hash: ${userData.password_hash.substring(0, 20)}...`);
        
        // Test with correct password
        const correctPassword = 'Donor123!';
        const isValid = await bcrypt.compare(correctPassword, userData.password_hash);
        console.log(`\n🔑 Testing correct password "${correctPassword}"`);
        console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        // Test with wrong password
        const wrongPassword = 'WrongPassword123!';
        const isWrong = await bcrypt.compare(wrongPassword, userData.password_hash);
        console.log(`\n🔑 Testing wrong password "${wrongPassword}"`);
        console.log(`   Result: ${isWrong ? '❌ VALID (should be invalid!)' : '✅ Invalid (correct)'}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().then(() => process.exit(0));
