// simple-server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const isProd = process.env.NODE_ENV === 'production';
const CLIENT_ORIGIN = isProd
  ? 'https://educonnect-8y46.onrender.com'
  : 'http://localhost:5173';

// trust proxy so Secure cookies work behind Render proxies
app.set('trust proxy', 1);

// Middleware
app.use(express.json());

// CORS (only matters when frontend is on a different origin, e.g. Vite 5173)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === CLIENT_ORIGIN) return cb(null, true);
      return cb(new Error('CORS not allowed'));
    },
    credentials: true,
  })
);

// Sessions
app.use(
  session({
    secret: 'daycare-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,                 // HTTPS only in prod
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// DB
const db = new sqlite3.Database('daycare.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    payment_tier TEXT DEFAULT 'good',
    total_owed REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents (id)
  )`);

  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run(
    `INSERT OR IGNORE INTO users (email, password, first_name, last_name)
     VALUES (?, ?, ?, ?)`,
    ['admin@daycare.com', hashedPassword, 'Admin', 'User']
  );
});

// Auth guard
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: 'Unauthorized' });
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    res.json(req.session.user);
  });
});
//public register daycare
app.post('/api/auth/register-daycare', async (req, res) => {
  const { daycareName, address, email, password, firstName, lastName } = req.body;
  if (!daycareName || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const exists = await getAsync(db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    await runAsync(db, 'INSERT INTO daycares (name, address) VALUES (?, ?)', [daycareName, address || null]);
    const daycare = await getAsync(db, 'SELECT * FROM daycares WHERE id = last_insert_rowid()');

    const hashed = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();
    await runAsync(
      db,
      `INSERT INTO users (id, email, password, first_name, last_name, role, daycare_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'daycare', ?, CAST((julianday('now')-2440587.5)*86400000 AS INT), CAST((julianday('now')-2440587.5)*86400000 AS INT))`,
      [id, email, hashed, firstName || null, lastName || null, daycare.id]
    );
    const user = await getAsync(db, 'SELECT * FROM users WHERE id = ?', [id]);

    req.session.user = { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role, daycare_id: user.daycare_id };
    res.json({ user: req.session.user, daycare });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
    res.json({ ok: true });
  });
});

app.get('/api/auth/user', (req, res) => {
  if (req.session && req.session.user) return res.json(req.session.user);
  res.status(401).json({ message: 'Not authenticated' });
});

// Parents
app.get('/api/parents', isAuthenticated, (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM parents';
  const params = [];
  if (search) {
    query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/parents', isAuthenticated, (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  db.run(
    'INSERT INTO parents (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
    [first_name, last_name, email, phone],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, first_name, last_name, email, phone });
    }
  );
});

// Children
app.get('/api/children', isAuthenticated, (req, res) => {
  db.all(
    `SELECT c.*, p.first_name AS parent_first_name, p.last_name AS parent_last_name
     FROM children c
     LEFT JOIN parents p ON c.parent_id = p.id`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/children', isAuthenticated, (req, res) => {
  const { first_name, last_name, date_of_birth, parent_id } = req.body;
  db.run(
    'INSERT INTO children (first_name, last_name, date_of_birth, parent_id) VALUES (?, ?, ?, ?)',
    [first_name, last_name, date_of_birth, parent_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, first_name, last_name, date_of_birth, parent_id });
    }
  );
});

// Health
app.get('/healthz', (_req, res) => res.send('ok'));

// Simple inline UI (same-origin when opened on :5000)
app.get('/', (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Daycare Management</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 480px; margin: 60px auto; padding: 20px; }
    input, button { width: 100%; padding: 10px; margin: 10px 0; }
    button { background: #007bff; color: white; border: none; cursor: pointer; }
    .dashboard { display: none; }
    .parent-form { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div id="login">
    <h2>Daycare Management Login</h2>
    <input type="email" id="email" placeholder="Email" value="admin@daycare.com">
    <input type="password" id="password" placeholder="Password" value="admin123">
    <button type="button" onclick="login()">Login</button>
  </div>

  <div id="dashboard" class="dashboard">
    <h2>Dashboard</h2>
    <button type="button" onclick="logout()">Logout</button>
    <div id="stats"></div>

    <div class="parent-form">
      <h3>Add New Parent</h3>
      <input type="text" id="parentFirstName" placeholder="First Name">
      <input type="text" id="parentLastName" placeholder="Last Name">
      <input type="email" id="parentEmail" placeholder="Email">
      <input type="tel" id="parentPhone" placeholder="Phone">
      <button type="button" onclick="addParent()">Add Parent</button>
    </div>

    <div id="parents"></div>
  </div>

  <script>
    // If served from :5000, use same-origin. If you embed this in a different origin, set window.API_BASE before load.
    const API_BASE = window.API_BASE || (location.port === '5000' ? '' : 'http://localhost:5000');

    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const response = await fetch(\`\${API_BASE}/api/auth/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadDashboard();
      } else {
        alert('Login failed');
      }
    }

    async function logout() {
      await fetch(\`\${API_BASE}/api/auth/logout\`, {
        method: 'POST',
        credentials: 'include',
      });

      document.getElementById('login').style.display = 'block';
      document.getElementById('dashboard').style.display = 'none';
    }

    async function loadDashboard() {
      const statsResponse = await fetch(\`\${API_BASE}/api/dashboard/stats\`, { credentials: 'include' });
      const stats = await statsResponse.json();
      document.getElementById('stats').innerHTML =
        \`<p>Total Parents: \${stats.totalParents}</p>
         <p>Good Payers: \${stats.goodPayers}</p>
         <p>Mid Payers: \${stats.midPayers}</p>
         <p>Non Payers: \${stats.nonPayers}</p>\`;

      const parentsResponse = await fetch(\`\${API_BASE}/api/parents\`, { credentials: 'include' });
      const parents = await parentsResponse.json();
      document.getElementById('parents').innerHTML =
        '<h3>Parents</h3>' + parents.map(p => \`<div>\${p.first_name} \${p.last_name} - \${p.email} - Tier: \${p.payment_tier}</div>\`).join('');
    }

    async function addParent() {
      const parent = {
        first_name: document.getElementById('parentFirstName').value,
        last_name: document.getElementById('parentLastName').value,
        email: document.getElementById('parentEmail').value,
        phone: document.getElementById('parentPhone').value
      };

      const response = await fetch(\`\${API_BASE}/api/parents\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parent),
        credentials: 'include',
      });

      if (response.ok) {
        document.getElementById('parentFirstName').value = '';
        document.getElementById('parentLastName').value = '';
        document.getElementById('parentEmail').value = '';
        document.getElementById('parentPhone').value = '';
        loadDashboard();
      }
    }
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📧 Login: admin@daycare.com`);
  console.log(`🔑 Password: admin123`);
});
