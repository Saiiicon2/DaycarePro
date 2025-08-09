const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');



const app = express();
const PORT = 5000;

// Create/open database
const db = new sqlite3.Database('daycare.db');

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'daycare-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
const plain = 'pass123';
const hash = '$2b$10$grq6CEU42VmGcD8L5t4s6ebHCD7eTx4kdaOFPn9EFhJxfEGOYq9LS'; // from DB

console.log(bcrypt.compareSync(plain, hash)); // Should print true

// Create tables
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

  // Create default admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const hashedDaycarePassword = bcrypt.hashSync('daycare123', 10);
  db.run(`INSERT OR IGNORE INTO users (email, password, first_name, last_name) 
          VALUES (?, ?, ?, ?)`, 
          ['admin@daycare.com', hashedPassword, 'Admin', 'User']);

         

});

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    req.session.user = { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name };
    res.json(req.session.user);
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/user', (req, res) => {
  if (req.session && req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Parent routes
app.get('/api/parents', isAuthenticated, (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM parents';
  let params = [];
  
  if (search) {
    query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/parents', isAuthenticated, (req, res) => {
  const { first_name, last_name, email, phone } = req.body;
  
  db.run('INSERT INTO parents (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
    [first_name, last_name, email, phone],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, first_name, last_name, email, phone });
    });
});

// Children routes
app.get('/api/children', isAuthenticated, (req, res) => {
  db.all(`SELECT c.*, p.first_name as parent_first_name, p.last_name as parent_last_name 
          FROM children c 
          LEFT JOIN parents p ON c.parent_id = p.id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/children', isAuthenticated, (req, res) => {
  const { first_name, last_name, date_of_birth, parent_id } = req.body;
  
  db.run('INSERT INTO children (first_name, last_name, date_of_birth, parent_id) VALUES (?, ?, ?, ?)',
    [first_name, last_name, date_of_birth, parent_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, first_name, last_name, date_of_birth, parent_id });
    });
});

// Dashboard stats
app.get('/api/dashboard/stats', isAuthenticated, (req, res) => {
  db.get(`SELECT 
    COUNT(*) as totalParents,
    SUM(CASE WHEN payment_tier = 'good' THEN 1 ELSE 0 END) as goodPayers,
    SUM(CASE WHEN payment_tier = 'mid' THEN 1 ELSE 0 END) as midPayers,
    SUM(CASE WHEN payment_tier = 'poor' THEN 1 ELSE 0 END) as nonPayers
    FROM parents`, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { totalParents: 0, goodPayers: 0, midPayers: 0, nonPayers: 0 });
  });
});

// Serve the login page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Daycare Management</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
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
            <button onclick="login()">Login</button>
        </div>
        
        <div id="dashboard" class="dashboard">
            <h2>Dashboard</h2>
            <button onclick="logout()">Logout</button>
            <div id="stats"></div>
            
            <div class="parent-form">
                <h3>Add New Parent</h3>
                <input type="text" id="parentFirstName" placeholder="First Name">
                <input type="text" id="parentLastName" placeholder="Last Name">
                <input type="email" id="parentEmail" placeholder="Email">
                <input type="tel" id="parentPhone" placeholder="Phone">
                <button onclick="addParent()">Add Parent</button>
            </div>
            
            <div id="parents"></div>
        </div>

        <script>
            async function login() {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                        credentials: "include",
                    });
                    
                    if (response.ok) {
                        document.getElementById('login').style.display = 'none';
                        document.getElementById('dashboard').style.display = 'block';
                        loadDashboard();
                    } else {
                        alert('Login failed');
                    }
                } catch (error) {
                    alert('Login error');
                }
            }
            
            async function logout() {
                await fetch('/api/auth/logout', { method: 'POST' });
                document.getElementById('login').style.display = 'block';
                document.getElementById('dashboard').style.display = 'none';
            }
            
            async function loadDashboard() {
                // Load stats
                const statsResponse = await fetch('/api/dashboard/stats');
                const stats = await statsResponse.json();
                document.getElementById('stats').innerHTML = 
                    \`<p>Total Parents: \${stats.totalParents}</p>
                     <p>Good Payers: \${stats.goodPayers}</p>
                     <p>Mid Payers: \${stats.midPayers}</p>
                     <p>Non Payers: \${stats.nonPayers}</p>\`;
                
                // Load parents
                const parentsResponse = await fetch('/api/parents');
                const parents = await parentsResponse.json();
                document.getElementById('parents').innerHTML = 
                    '<h3>Parents</h3>' + 
                    parents.map(p => \`<div>\${p.first_name} \${p.last_name} - \${p.email} - Tier: \${p.payment_tier}</div>\`).join('');
            }
            
            async function addParent() {
                const parent = {
                    first_name: document.getElementById('parentFirstName').value,
                    last_name: document.getElementById('parentLastName').value,
                    email: document.getElementById('parentEmail').value,
                    phone: document.getElementById('parentPhone').value
                };
                
                const response = await fetch('/api/parents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parent),
                    credentials: "include"
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