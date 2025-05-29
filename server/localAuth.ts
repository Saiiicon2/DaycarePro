import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

export function setupLocalAuth(app: express.Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      // For development, create a default admin user if none exists
      const users = await storage.getUsers();
      if (users.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await storage.createUser({
          email: 'admin@daycare.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Remove password from session data
      const { password: _, ...userWithoutPassword } = user;
      (req.session as any).user = userWithoutPassword;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Register route (for creating new users)
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin'
      });

      const { password: _, ...userWithoutPassword } = user;
      (req.session as any).user = userWithoutPassword;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });
}

export const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req.session as any)?.user;
  if (user) {
    req.user = user;
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};