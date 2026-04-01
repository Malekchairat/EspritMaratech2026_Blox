import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createAdmin() {
    console.log('🔐 Creating admin account...');

    const email = 'admin@blox.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const openId = nanoid();

    try {
        const result = await sql`
      INSERT INTO users (open_id, email, password_hash, name, role, login_method, created_at)
      VALUES (${openId}, ${email}, ${hashedPassword}, 'Admin User', 'admin', 'password', NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = ${hashedPassword},
        role = 'admin'
      RETURNING id, email, name, role
    `;

        console.log('✅ Admin account created successfully!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('👤 User:', result[0]);
        console.log('\n⚠️  Please change this password after first login!');
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
}

createAdmin().then(() => process.exit(0));
