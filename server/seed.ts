import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, daycares, parents, children, enrollments, payments } from '../shared/schema';
import bcrypt from 'bcryptjs';

const sqlite = new Database('./server/db.sqlite');
const db = drizzle(sqlite);

async function seed() {
  const hashedPassword = await bcrypt.hash("admin123", 10); // ✅ Hash the password

  try {
    await db.insert(users).values({
      id: 'user-1',
      email: 'admin@daycare.com',
      password: hashedPassword,     // ✅ Insert hashed password
      firstName: 'Admin',
      lastName: 'User',
      role: 'system_admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  } catch (e) {
    // ignore if already exists
  }

  // create a sample daycare, parent, child, enrollment and payments
  try {
  await db.insert(daycares).values({
      id: 1,
      name: 'Green Kids Learning Center',
      address: '123 Elm Street',
      phone: '555-1234',
      email: 'contact@greenkids.example',
      licenseNumber: 'LIC-001',
      capacity: 50,
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  } catch (e) {
    // ignore if already exists
  }

  try {
  await db.insert(parents).values({
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '555-0101',
      paymentTier: 'good_payer',
      totalOwed: 0,
      isBlacklisted: 0,
      daycareId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  } catch (e) {}

  try {
  await db.insert(children).values({
      id: 1,
      firstName: 'Tom',
      lastName: 'Doe',
  dateOfBirth: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), // ~3 years ago
      parentId: 1,
      currentDaycareId: 1,
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  } catch (e) {}

  try {
  await db.insert(enrollments).values({
      id: 1,
      childId: 1,
      daycareId: 1,
  startDate: new Date(),
      monthlyFee: 150.0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  } catch (e) {}

  // create a few payments for the enrollment
    try {
      const now = Date.now();
      await db.insert(payments).values([
        {
          enrollmentId: 1,
          parentId: 1,
          amount: 150.0,
          dueDate: new Date(now - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          paidDate: null,
          status: 'overdue',
          paymentMethod: null,
          notes: 'Monthly fee (previous month)',
          createdAt: new Date(now - 35 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
        },
        {
          enrollmentId: 1,
          parentId: 1,
          amount: 150.0,
          dueDate: new Date(now),
          paidDate: null,
          status: 'pending',
          paymentMethod: null,
          notes: 'Monthly fee (current month)',
          createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
        },
        {
          enrollmentId: 1,
          parentId: 1,
          amount: 150.0,
          dueDate: new Date(now - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          paidDate: new Date(now - 55 * 24 * 60 * 60 * 1000),
          status: 'paid',
          paymentMethod: 'cash',
          notes: 'Monthly fee (two months ago) - paid',
          createdAt: new Date(now - 65 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now - 55 * 24 * 60 * 60 * 1000),
        },
      ] as any);
    } catch (e) {}

  console.log('✅ Seed complete');
}

seed().catch((e) => console.error('❌ Seed error:', e));
