import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function seedUsers() {
    console.log('👥 Creating 3 users with different roles...\n');

    const users = [
        {
            email: 'donor@blox.com',
            password: 'Donor123!',
            name: 'John Donor',
            role: 'donor',
        },
        {
            email: 'association@blox.com',
            password: 'Association123!',
            name: 'Care Association',
            role: 'association',
        },
        {
            email: 'admin@blox.com',
            password: 'Admin123!',
            name: 'Admin User',
            role: 'admin',
        },
    ];

    try {
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            const openId = nanoid();

            await sql`
                INSERT INTO users (open_id, email, password_hash, name, role, login_method, created_at, updated_at, last_signed_in)
                VALUES (${openId}, ${user.email}, ${hashedPassword}, ${user.name}, ${user.role}, 'password', NOW(), NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET
                    password_hash = ${hashedPassword},
                    role = ${user.role},
                    name = ${user.name},
                    updated_at = NOW()
            `;

            console.log(`✅ ${user.role.toUpperCase()} user created/updated`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🔑 Password: ${user.password}`);
            console.log(`   👤 Name: ${user.name}\n`);
        }

        console.log('🎉 All users created successfully!');
    } catch (error) {
        console.error('❌ Error creating users:', error);
        process.exit(1);
    }
}

await seedUsers();
process.exit(0);
