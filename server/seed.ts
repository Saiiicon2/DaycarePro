import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users } from '../shared/schema';
import bcrypt from 'bcryptjs';

const sqlite = new Database('./server/db.sqlite');
const db = drizzle(sqlite);

async function seed() {
  const hashedPassword = await bcrypt.hash("admin123", 10); // ✅ Hash the password

  await db.insert(users).values({
    id: 'user-1',
    email: 'admin@daycare.com',
    password: hashedPassword,     // ✅ Insert hashed password
    firstName: 'Admin',
    lastName: 'User',
    role: 'system_admin',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  console.log('✅ Seed complete');
}

seed().catch((e) => console.error('❌ Seed error:', e));
