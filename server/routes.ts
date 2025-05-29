import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDaycareSchema,
  insertParentSchema,
  insertChildSchema,
  insertEnrollmentSchema,
  insertPaymentSchema,
  insertPaymentAlertSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard analytics
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Daycare routes
  app.get('/api/daycares', isAuthenticated, async (req, res) => {
    try {
      const daycares = await storage.getDaycares();
      res.json(daycares);
    } catch (error) {
      console.error("Error fetching daycares:", error);
      res.status(500).json({ message: "Failed to fetch daycare centers" });
    }
  });

  app.get('/api/daycares/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const daycare = await storage.getDaycare(id);
      
      if (!daycare) {
        return res.status(404).json({ message: "Daycare center not found" });
      }
      
      res.json(daycare);
    } catch (error) {
      console.error("Error fetching daycare:", error);
      res.status(500).json({ message: "Failed to fetch daycare center" });
    }
  });

  app.post('/api/daycares', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDaycareSchema.parse(req.body);
      const daycare = await storage.createDaycare(validatedData);
      res.status(201).json(daycare);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid daycare data", errors: error.errors });
      }
      console.error("Error creating daycare:", error);
      res.status(500).json({ message: "Failed to create daycare center" });
    }
  });

  app.put('/api/daycares/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDaycareSchema.partial().parse(req.body);
      const daycare = await storage.updateDaycare(id, validatedData);
      res.json(daycare);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid daycare data", errors: error.errors });
      }
      console.error("Error updating daycare:", error);
      res.status(500).json({ message: "Failed to update daycare center" });
    }
  });

  // Parent routes
  app.get('/api/parents', isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const parents = await storage.getParents(search);
      res.json(parents);
    } catch (error) {
      console.error("Error fetching parents:", error);
      res.status(500).json({ message: "Failed to fetch parents" });
    }
  });

  app.get('/api/parents/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parent = await storage.getParentWithChildren(id);
      
      if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
      }
      
      res.json(parent);
    } catch (error) {
      console.error("Error fetching parent:", error);
      res.status(500).json({ message: "Failed to fetch parent" });
    }
  });

  app.post('/api/parents', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertParentSchema.parse(req.body);
      
      // Check if parent already exists by email
      const existingParent = await storage.getParentByEmail(validatedData.email);
      if (existingParent) {
        return res.status(409).json({ message: "Parent with this email already exists" });
      }
      
      const parent = await storage.createParent(validatedData);
      res.status(201).json(parent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parent data", errors: error.errors });
      }
      console.error("Error creating parent:", error);
      res.status(500).json({ message: "Failed to create parent" });
    }
  });

  app.put('/api/parents/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertParentSchema.partial().parse(req.body);
      const parent = await storage.updateParent(id, validatedData);
      res.json(parent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parent data", errors: error.errors });
      }
      console.error("Error updating parent:", error);
      res.status(500).json({ message: "Failed to update parent" });
    }
  });

  // Parent lookup (cross-ecosystem search)
  app.post('/api/parents/lookup', isAuthenticated, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required for lookup" });
      }
      
      const parent = await storage.getParentByEmail(email);
      if (!parent) {
        return res.status(404).json({ message: "Parent not found in ecosystem" });
      }
      
      // Get payment history
      const payments = await storage.getPayments(parent.id);
      
      res.json({
        parent,
        paymentHistory: payments,
        recommendation: parent.paymentTier === 'non_payer' ? 'REJECT' : 
                      parent.paymentTier === 'mid_payer' ? 'CAUTION' : 'APPROVE'
      });
    } catch (error) {
      console.error("Error in parent lookup:", error);
      res.status(500).json({ message: "Failed to perform parent lookup" });
    }
  });

  // Child routes
  app.get('/api/children', isAuthenticated, async (req, res) => {
    try {
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      const children = await storage.getChildren(parentId);
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post('/api/children', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertChildSchema.parse(req.body);
      const child = await storage.createChild(validatedData);
      res.status(201).json(child);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid child data", errors: error.errors });
      }
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child profile" });
    }
  });

  // Enrollment routes
  app.get('/api/enrollments', isAuthenticated, async (req, res) => {
    try {
      const daycareId = req.query.daycareId ? parseInt(req.query.daycareId as string) : undefined;
      const enrollments = await storage.getEnrollments(daycareId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post('/api/enrollments', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEnrollmentSchema.parse(req.body);
      
      // Check if parent has payment issues before allowing enrollment
      const child = await storage.getChild(validatedData.childId);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      const parent = await storage.getParent(child.parentId);
      if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
      }
      
      // Create alert if parent is flagged
      if (parent.paymentTier === 'non_payer' || parent.isBlacklisted) {
        await storage.createAlert({
          parentId: parent.id,
          daycareId: validatedData.daycareId,
          alertType: 'enrollment_attempt',
          message: `${parent.firstName} ${parent.lastName} attempted enrollment with ${parent.paymentTier} status`,
          severity: parent.paymentTier === 'non_payer' ? 'high' : 'medium',
        });
        
        return res.status(400).json({ 
          message: "Enrollment blocked due to payment history",
          parentTier: parent.paymentTier,
          totalOwed: parent.totalOwed
        });
      }
      
      const enrollment = await storage.createEnrollment(validatedData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  // Payment routes
  app.get('/api/payments', isAuthenticated, async (req, res) => {
    try {
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      const enrollmentId = req.query.enrollmentId ? parseInt(req.query.enrollmentId as string) : undefined;
      const payments = await storage.getPayments(parentId, enrollmentId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment record" });
    }
  });

  app.put('/api/payments/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPaymentSchema.partial().parse(req.body);
      const payment = await storage.updatePayment(id, validatedData);
      
      // If payment status changed to paid, update parent tier if needed
      if (validatedData.status === 'paid') {
        const paymentDetails = await storage.getPayment(id);
        if (paymentDetails) {
          // Recalculate parent tier based on payment history
          const allPayments = await storage.getPayments(paymentDetails.parent.id);
          const overduePayments = allPayments.filter(p => p.status === 'overdue').length;
          const totalPayments = allPayments.length;
          
          let newTier = 'good_payer';
          if (overduePayments > totalPayments * 0.5) {
            newTier = 'non_payer';
          } else if (overduePayments > totalPayments * 0.2) {
            newTier = 'mid_payer';
          }
          
          const totalOwed = allPayments
            .filter(p => p.status !== 'paid')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0)
            .toFixed(2);
          
          await storage.updateParentTier(paymentDetails.parent.id, newTier, totalOwed);
        }
      }
      
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // Alert routes
  app.get('/api/alerts', isAuthenticated, async (req, res) => {
    try {
      const resolved = req.query.resolved === 'true' ? true : 
                     req.query.resolved === 'false' ? false : undefined;
      const alerts = await storage.getAlerts(resolved);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post('/api/alerts', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPaymentAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.put('/api/alerts/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const resolvedBy = `${req.user.claims.first_name || ''} ${req.user.claims.last_name || ''}`.trim() || 'System';
      const alert = await storage.resolveAlert(id, resolvedBy);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
