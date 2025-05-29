import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('daycare.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'admin',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS daycares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    payment_tier TEXT DEFAULT 'good',
    total_owed REAL DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT,
    parent_id INTEGER REFERENCES parents(id),
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER REFERENCES children(id),
    daycare_id INTEGER REFERENCES daycares(id),
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'active',
    monthly_fee REAL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER REFERENCES parents(id),
    enrollment_id INTEGER REFERENCES enrollments(id),
    amount REAL NOT NULL,
    due_date TEXT,
    paid_date TEXT,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS payment_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER REFERENCES parents(id),
    daycare_id INTEGER REFERENCES daycares(id),
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    is_resolved INTEGER DEFAULT 0,
    resolved_by TEXT,
    resolved_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

// Create default admin user
const hashedPassword = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (email, password, first_name, last_name, role) 
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('admin@daycare.com', hashedPassword, 'Admin', 'User', 'admin');

// Create sample daycare
const insertDaycare = db.prepare(`
  INSERT OR IGNORE INTO daycares (name, address, phone, email) 
  VALUES (?, ?, ?, ?)
`);

insertDaycare.run('Sunshine Daycare', '123 Main St, City, State', '555-0123', 'contact@sunshine-daycare.com');

console.log('SQLite database setup complete!');
console.log('Default admin login: admin@daycare.com');
console.log('Default password: admin123');
console.log('Database file: daycare.db');

db.close();