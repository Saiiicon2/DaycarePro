import type { Express } from "express";
import { createServer, type Server } from "http";
import { createHash } from "crypto";
import { storage } from "./storage";
import { requireMembership } from "./middleware/requireMembership";
import {
  insertDaycareSchema,
  insertParentSchema,
  insertChildSchema,
  insertEnrollmentSchema,
  insertPaymentSchema,
  insertPaymentAlertSchema,
  upsertUserSchema,
} from "@shared/schema";
import { z } from "zod";

const isAdmin = (u: any) => u?.role === "admin" || u?.role === "system_admin";

export async function registerRoutes(app: Express): Promise<Server> {

  const adminOnly = (req: any, res: any, next: any) => {
  const isAdmin = req.user?.role === "admin" || req.user?.role === "system_admin";
  if (!isAdmin) return res.status(403).json({ message: "Admins only" });
  next();
};
  // Local Auth
  const { setupLocalAuth, isAuthenticated } = await import("./localAuth");
  setupLocalAuth(app);

//END POINT TO SWITCH ACTIVE DAYCARE
app.post('/api/auth/active-daycare', isAuthenticated, async (req: any, res) => {
  const { daycareId } = req.body ?? {};
  if (!daycareId) return res.status(400).json({ message: "daycareId required" });

  const ok = await storage.userCanAccessDaycare(req.user.id, Number(daycareId));
  if (!ok) return res.status(403).json({ message: "You don’t have access to that daycare" });

  if (req.session) {
    req.session.user = { ...(req.session.user || {}), activeDaycareId: Number(daycareId) };
  }
  req.user.activeDaycareId = Number(daycareId);
  res.status(204).end();
});

app.get("/api/ecosystems", isAuthenticated, adminOnly, async (_req, res) => {
  try {
    const rows = await storage.getEcosystems();
    res.json(rows);
  } catch (error) {
    console.error("Error fetching ecosystems:", error);
    res.status(500).json({ message: "Failed to fetch ecosystems" });
  }
});

app.post("/api/ecosystems", isAuthenticated, adminOnly, async (req: any, res) => {
  try {
    const data = z.object({
      accountId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      payfastMerchantId: z.string().optional(),
      payfastMerchantKey: z.string().optional(),
      payfastPassphrase: z.string().optional(),
      payfastMode: z.enum(["sandbox", "live"]).default("sandbox"),
    }).parse(req.body);

    const row = await storage.createEcosystem(data as any);
    res.status(201).json(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid ecosystem data", errors: error.errors });
    }
    console.error("Error creating ecosystem:", error);
    res.status(500).json({ message: "Failed to create ecosystem" });
  }
});

app.get("/api/ecosystems/:id/daycares", isAuthenticated, adminOnly, async (req: any, res) => {
  try {
    const ecosystemId = Number(req.params.id);
    const rows = await storage.getDaycaresByEcosystem(ecosystemId);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching daycares for ecosystem:", error);
    res.status(500).json({ message: "Failed to fetch ecosystem daycares" });
  }
});

// Daycare routes
// Require authentication so we can determine whether the caller is admin or a member
app.get("/api/daycares", isAuthenticated, async (req: any, res) => {
    try {
      const u = req.user; // set by your isAuthenticated middleware
      const ecosystemId = req.query.ecosystemId ? Number(req.query.ecosystemId) : undefined;
      const list = isAdmin(u)
        ? ecosystemId
          ? await storage.getDaycaresByEcosystem(ecosystemId)
          : await storage.getDaycares()
        : await storage.getUserDaycares(u.id);
      res.json(list);
    } catch (err) {
      console.error("Error fetching daycares:", err);
      res.status(500).json({ message: "Failed to fetch daycare centers" });
    }
  });


  // NOTE: daycare registration is handled by the authenticated/admin route below

  


  // After auth, ensure non-admins always have an activeDaycareId
app.use('/api', isAuthenticated, async (req: any, _res, next) => {
  try {
    const u = req.user;
    if (!isAdmin(u) && !u.activeDaycareId) {
      const ms = await storage.getMemberships(u.id);
      if (ms?.length) {
        const firstDcId = ms[0].daycareId;
        // persist to session so subsequent requests have it
        if (req.session) {
          req.session.user = { ...(req.session.user || {}), activeDaycareId: firstDcId };
        }
        req.user.activeDaycareId = firstDcId;
      }
    }
  } catch (e) {
    console.warn("Could not set activeDaycareId:", e);
  }
  next();
});

  //stale session proof
app.use(async (req: any, _res, next) => {
  try {
    if (req.user?.id) {
      const fresh = await storage.getUser(req.user.id);
      if (fresh) req.user = fresh;
    }
  } catch {}
  next();
});
  // -------- Auth --------
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    res.json(req.user);
  });

  // -------- Users (admin) --------
  app.get("/api/users", isAuthenticated, adminOnly, async (_req, res) => {
    try {
      const rows = await storage.getUsers();
      res.json(rows);
    } catch (e) {
      console.error("Error fetching users:", e);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create user (admin only)
  app.post("/api/users", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const data = upsertUserSchema.partial().extend({
        password: z.string().optional(),
      }).parse(req.body);

      // Hash password if provided
      const bcrypt = await import("bcryptjs");
      if (data.password) {
        const hashed = await bcrypt.hash(data.password, 10);
        data.password = hashed;
      }

      // Ensure an id exists for the user; generate if missing
      if (!data.id) {
        try {
          data.id = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2);
        } catch {
          data.id = String(Date.now()) + Math.random().toString(36).slice(2);
        }
      }

      const created = await storage.createUser(data as any);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user (admin only)
  app.put("/api/users/:id", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const id = String(req.params.id);
      const data = upsertUserSchema.partial().extend({ password: z.string().optional() }).parse(req.body);

      // If password provided, hash it
      if ((data as any).password) {
        const bcrypt = await import("bcryptjs");
        (data as any).password = await bcrypt.hash((data as any).password, 10);
      }

      // ensure id present for upsert
      const toUpsert = { ...(data as any), id };
      const updated = await storage.upsertUser(toUpsert as any);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // -------- Memberships (admin manage user memberships) --------
  app.get("/api/users/:id/memberships", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const userId = String(req.params.id);
      const rows = await storage.getMemberships(userId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching memberships:", e);
      res.status(500).json({ message: "Failed to fetch memberships" });
    }
  });

  app.post("/api/users/:id/memberships", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const userId = String(req.params.id);
      const Body = z.object({ daycareId: z.number().int().positive(), role: z.enum(["daycare", "manager", "admin"]).optional() });
      const { daycareId, role } = Body.parse(req.body);
      const row = await storage.addMembership(userId, daycareId, role as any);
      res.status(201).json(row);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid membership data", errors: e.errors });
      console.error("Error adding membership:", e);
      res.status(500).json({ message: "Failed to add membership" });
    }
  });

  app.delete("/api/users/:id/memberships/:daycareId", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const userId = String(req.params.id);
      const daycareId = Number(req.params.daycareId);
      await storage.removeMembership(userId, daycareId);
      res.status(204).end();
    } catch (e) {
      console.error("Error removing membership:", e);
      res.status(500).json({ message: "Failed to remove membership" });
    }
  });

  app.put("/api/users/:id/memberships", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const userId = String(req.params.id);
      const Body = z.object({ daycareId: z.number().int().positive(), role: z.string().optional(), isActive: z.boolean().optional() });
      const { daycareId, role, isActive } = Body.parse(req.body);
      const row = await storage.updateMembership(userId, daycareId, { role, isActive });
      res.json(row);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid membership update", errors: e.errors });
      console.error("Error updating membership:", e);
      res.status(500).json({ message: "Failed to update membership" });
    }
  });

  // -------- Dashboard --------
  app.get("/api/dashboard/stats", isAuthenticated, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // -------- Memberships (for frontend daycare switcher) --------
  app.get("/api/memberships/me", isAuthenticated, async (req: any, res, next) => {
    try {
      const rows = await storage.getMemberships(req.user.id);
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

 

  app.get("/api/daycares/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const row = await storage.getDaycare(id);
      if (!row) return res.status(404).json({ message: "Daycare center not found" });
      res.json(row);
    } catch (e) {
      console.error("Error fetching daycare:", e);
      res.status(500).json({ message: "Failed to fetch daycare center" });
    }
  });

  // Admin-only daycare creation endpoint
  app.post(
    "/api/daycares",
    isAuthenticated,
    adminOnly,
    async (req: any, res) => {
      try {
        // Admins may optionally assign an owner by email.
        const BodySchema = insertDaycareSchema.extend({
          ownerEmail: z.string().email().optional(),
          ecosystemId: z.number().int().positive().optional(),
        });

        const { ownerEmail, ...daycarePayload } = BodySchema.parse(req.body);

        // Create the daycare
        const daycare = await storage.createDaycare(daycarePayload as any);

        // Admin flow: optionally link an existing user as manager/owner
        let ownerLinked = false;
        let ownerUserId: string | null = null;

        if (ownerEmail) {
          const email = ownerEmail.trim().toLowerCase();
          const user = await storage.getUserByEmail(email);
          if (user) {
            await storage.addMembership(user.id, daycare.id, "manager");
            ownerLinked = true;
            ownerUserId = user.id;
          }
        }

        return res.status(201).json({
          daycare,
          ownerLinked,
          ownerUserId,
          message:
            ownerEmail && !ownerLinked
              ? "Daycare created. No user with that email; assign later."
              : "Daycare created.",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid daycare data", errors: error.errors });
        }
        console.error("Error creating daycare:", error);
        res.status(500).json({ message: "Failed to create daycare center" });
      }
    }
  );

  app.put("/api/daycares/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = insertDaycareSchema.partial().parse(req.body);
      const row = await storage.updateDaycare(id, data);
      res.json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid daycare data", errors: error.errors });
      }
      console.error("Error updating daycare:", error);
      res.status(500).json({ message: "Failed to update daycare center" });
    }
  });

  // -------- Parents --------
 app.get("/api/parents", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const list = await storage.getParents(search, req.daycareId);
      res.json(list);
    } catch (e) {
      console.error("Error fetching parents:", e);
      res.status(500).json({ message: "Failed to fetch parents" });
    }
  });

  app.get("/api/parents/:id", isAuthenticated, requireMembership(), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parent = await storage.getParentWithChildren(id);
      if (!parent) return res.status(404).json({ message: "Parent not found" });
      // Optional: ensure parent.daycareId === req.daycareId for non-admins
      res.json(parent);
    } catch (e) {
      console.error("Error fetching parent:", e);
      res.status(500).json({ message: "Failed to fetch parent" });
    }
  });

  app.post(
  "/api/parents",
  isAuthenticated,
  requireMembership("daycareId", { adminBypass: true }),
  async (req: any, res) => {
    try {
      const u = req.user;

      // parse body; daycareId may be missing from admin submits
      const raw = insertParentSchema.parse(req.body);
      const email = String(raw.email || "").trim().toLowerCase();

      // resolve daycare to attach:
      // - non-admin → always req.daycareId from middleware
      // - admin → prefer body.daycareId, else req.daycareId (if present)
      const resolvedDaycareId =
        !isAdmin(u) ? req.daycareId : (raw as any).daycareId ?? req.daycareId;

      if (!resolvedDaycareId) {
        // friendly message when admin didn’t select a daycare in the form
        return res
          .status(400)
          .json({ message: "Please choose a daycare for this parent (daycareId)." });
      }

      const resolvedDaycare = await storage.getDaycare(resolvedDaycareId);
      if (!resolvedDaycare) {
        return res.status(404).json({ message: "Resolved daycare not found" });
      }

      const existing = await storage.getParentByEmail(email);
      const existingInEcosystem = resolvedDaycare.ecosystemId
        ? await storage.getParentByEmailInEcosystem(email, resolvedDaycare.ecosystemId)
        : undefined;

      if (existingInEcosystem) {
        return res.status(409).json({
          message: "Parent already exists in this ecosystem",
          existingParentId: existingInEcosystem.id,
          existingDaycareId: existingInEcosystem.daycareId,
          ecosystemId: existingInEcosystem.ecosystemId,
        });
      }

      if (existing && existing.ecosystemId && resolvedDaycare.ecosystemId && existing.ecosystemId !== resolvedDaycare.ecosystemId) {
        return res.status(409).json({
          message: "Parent exists in a different ecosystem",
          existingParentId: existing.id,
          existingEcosystemId: existing.ecosystemId,
          targetEcosystemId: resolvedDaycare.ecosystemId,
        });
      }

      if (existing && existing.daycareId === resolvedDaycareId) {
        return res.status(409).json({
          message: "Parent already exists in this daycare",
          existingParentId: existing.id,
        });
      }

      const payload = {
        ...raw,
        email,
        daycareId: resolvedDaycareId,
        ecosystemId: resolvedDaycare.ecosystemId ?? null,
      };

      const parent = await storage.createParent(payload as any);
      return res.status(201).json(parent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid parent data", errors: error.errors });
      }
      console.error("Error creating parent:", error);
      return res.status(500).json({ message: "Failed to create parent" });
    }
  }
);

  app.put("/api/parents/:id", isAuthenticated, requireMembership(), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = insertParentSchema.partial().parse(req.body);
      const row = await storage.updateParent(id, data);
      res.json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parent data", errors: error.errors });
      }
      console.error("Error updating parent:", error);
      res.status(500).json({ message: "Failed to update parent" });
    }
  });

  // Admin-only: toggle blacklist on parent
  app.post("/api/parents/:id/blacklist", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      console.log('[routes] POST /api/parents/:id/blacklist called by', req.user?.id, 'body=', req.body);
      const { isBlacklisted } = req.body ?? {};
      if (typeof isBlacklisted !== "boolean") return res.status(400).json({ message: "isBlacklisted boolean required" });
      const row = await storage.updateParent(id, { isBlacklisted });
      // Audit: parent blacklist toggled
      try {
        await storage.addAudit({
          action: "blacklist_toggle",
          actorId: req.user?.id ?? null,
          targetType: "parent",
          targetId: String(id),
          daycareId: req.daycareId ?? null,
          payload: { isBlacklisted },
        });
      } catch (auditErr) {
        console.warn("Failed to write audit log for blacklist:", auditErr);
      }
      res.json(row);
    } catch (e) {
      console.error("Error toggling blacklist:", e);
      res.status(500).json({ message: "Failed to update parent blacklist" });
    }
  });

  // -------- Children --------
  app.get("/api/children", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;
      const list = await storage.getChildren(parentId, req.daycareId);
      res.json(list);
    } catch (e) {
      console.error("Error fetching children:", e);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post("/api/children", isAuthenticated, requireMembership(), async (req: any, res) => {
    try {
      const parsed = insertChildSchema.parse(req.body);
      const parent = await storage.getParent(parsed.parentId);
      if (!parent) return res.status(404).json({ message: "Parent not found" });
      if (!isAdmin(req.user) && parent.daycareId !== req.daycareId) {
        return res.status(403).json({ message: "Parent belongs to a different daycare" });
      }

      const payload = isAdmin(req.user)
        ? { ...parsed, currentDaycareId: parsed.currentDaycareId ?? parent.daycareId ?? null }
        : { ...parsed, currentDaycareId: req.daycareId };

      const row = await storage.createChild(payload as any);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid child data", errors: error.errors });
      }
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child profile" });
    }
  });

  app.post("/api/parents/lookup", isAuthenticated, async (req, res) => {
  try {
    const { email, ecosystemId } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required for lookup" });

    let parent;
    const normalizedEmail = String(email).trim().toLowerCase();
    if (ecosystemId) {
      parent = await storage.getParentByEmailInEcosystem(normalizedEmail, Number(ecosystemId));
    } else if (req.daycareId) {
      const daycare = await storage.getDaycare(req.daycareId);
      if (daycare?.ecosystemId) {
        parent = await storage.getParentByEmailInEcosystem(normalizedEmail, daycare.ecosystemId);
      }
    }

    if (!parent) {
      parent = await storage.getParentByEmail(normalizedEmail);
    }

    if (!parent) return res.status(404).json({ message: "Parent not found in ecosystem" });

    const payments = await storage.getPayments(parent.id); // global history for that parent
    res.json({
      parent,
      paymentHistory: payments,
      recommendation:
        parent.paymentTier === "non_payer" ? "REJECT" :
        parent.paymentTier === "mid_payer"  ? "CAUTION" : "APPROVE",
    });
  } catch (e) {
    console.error("Error in parent lookup:", e);
    res.status(500).json({ message: "Failed to perform parent lookup" });
  }
});

  // ===== ECOSYSTEM SAFETY & MONITORING ENDPOINTS =====

  /**
   * Get parent's complete profile across their entire ecosystem
   * Shows all daycares, enrollment history, and payment issues
   */
  app.get("/api/parents/:id/ecosystem-profile", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const parentId = Number(req.params.id);
      const parent = await storage.getParent(parentId);
      if (!parent) return res.status(404).json({ message: "Parent not found" });

      if (!parent.ecosystemId) {
        return res.status(400).json({ message: "Parent is not assigned to an ecosystem" });
      }

      const profile = await storage.getParentEcosystemProfile(parentId, parent.ecosystemId);
      res.json(profile);
    } catch (e) {
      console.error("Error fetching parent ecosystem profile:", e);
      res.status(500).json({ message: "Failed to fetch parent ecosystem profile" });
    }
  });

  /**
   * Get all alerts for a specific ecosystem (unresolved or all)
   */
  app.get("/api/ecosystems/:id/alerts", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const ecosystemId = Number(req.params.id);
      if (isNaN(ecosystemId)) {
        return res.status(400).json({ message: "Invalid ecosystem ID" });
      }
      
      const unresolved = req.query.unresolved === "true" ? true : undefined;
      const alertType = req.query.alertType ? String(req.query.alertType) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 100;

      const alerts = await storage.getEcosystemAlerts(ecosystemId, {
        unresolved,
        alertType,
        limit,
      });
      res.json(alerts);
    } catch (e) {
      console.error("Error fetching ecosystem alerts:", e);
      res.status(500).json({ message: "Failed to fetch ecosystem alerts", error: String(e) });
    }
  });

  /**
   * Get suspicious activity summary for an ecosystem
   * Shows: simultaneous enrollments, recent transfers, blacklist status
   */
  app.get("/api/ecosystems/:id/suspicious-activity", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const ecosystemId = Number(req.params.id);
      if (isNaN(ecosystemId)) {
        return res.status(400).json({ message: "Invalid ecosystem ID" });
      }
      
      // Get high-severity unresolved alerts
      const alerts = await storage.getEcosystemAlerts(ecosystemId, {
        unresolved: true,
        limit: 1000,
      });

      const suspicious = {
        totalUnresolvedAlerts: alerts.length,
        simultaneousEnrollments: alerts.filter(a => a.alertType === "simultaneous_enrollment").length,
        suspiciousTransfers: alerts.filter(a => a.alertType === "suspicious_transfer").length,
        enrollmentAttempts: alerts.filter(a => a.alertType === "enrollment_attempt").length,
        highSeverityCount: alerts.filter(a => a.severity === "high").length,
        mediumSeverityCount: alerts.filter(a => a.severity === "medium").length,
        recentAlerts: alerts.slice(0, 20),
      };

      res.json(suspicious);
    } catch (e) {
      console.error("Error fetching suspicious activity summary:", e);
      res.status(500).json({ message: "Failed to fetch suspicious activity summary", error: String(e) });
    }
  });

  /**
   * Toggle enforcement mode for an ecosystem
   * enforceAlerts: true = ENFORCE (block suspicious enrollments)
   * enforceAlerts: false = MONITOR (alert only, allow enrollments)
   */
  app.put("/api/ecosystems/:id/enforcement", isAuthenticated, adminOnly, async (req: any, res) => {
    try {
      const ecosystemId = Number(req.params.id);
      const { enforceAlerts } = req.body;

      if (typeof enforceAlerts !== "boolean") {
        return res.status(400).json({ message: "enforceAlerts must be a boolean" });
      }

      const ecosystem = await storage.getEcosystem(ecosystemId);
      if (!ecosystem) return res.status(404).json({ message: "Ecosystem not found" });

      // Update enforcement mode
      const updated = await storage.updateEcosystem(ecosystemId, { enforceAlerts });

      // Audit the change
      try {
        await storage.addAudit({
          action: "enforcement_toggle",
          actorId: req.user?.id ?? null,
          targetType: "ecosystem",
          targetId: String(ecosystemId),
          payload: { enforceAlerts, previousEnforceAlerts: ecosystem.enforceAlerts },
        });
      } catch (auditErr) {
        console.warn("Failed to write audit log for enforcement toggle:", auditErr);
      }

      res.json({
        id: updated.id,
        name: updated.name,
        enforceAlerts: updated.enforceAlerts,
        mode: updated.enforceAlerts ? "ENFORCE (blocking)" : "MONITOR (alerts only)",
        message: `Ecosystem switched to ${updated.enforceAlerts ? "ENFORCE" : "MONITOR"} mode`,
      });
    } catch (e) {
      console.error("Error toggling enforcement mode:", e);
      res.status(500).json({ message: "Failed to toggle enforcement mode" });
    }
  });

  // -------- Enrollments --------
  app.get("/api/enrollments", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const rows = await storage.getEnrollments(req.daycareId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching enrollments:", e);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, requireMembership(), async (req: any, res) => {
    try {
      const parsed = insertEnrollmentSchema.parse({ ...req.body, daycareId: req.daycareId });
      const child = await storage.getChild(parsed.childId);
      if (!child) return res.status(404).json({ message: "Child not found" });

      const parent = await storage.getParent(child.parentId);
      if (!parent) return res.status(404).json({ message: "Parent not found" });

      if (parent.paymentTier === "non_payer" || (parent as any).isBlacklisted) {
        await storage.createAlert({
          parentId: parent.id,
          daycareId: parsed.daycareId,
          alertType: "enrollment_attempt",
          message: `${parent.firstName} ${parent.lastName} attempted enrollment with ${parent.paymentTier} status`,
          severity: parent.paymentTier === "non_payer" ? "high" : "medium",
        });
        return res.status(400).json({
          message: "Enrollment blocked due to payment history",
          parentTier: parent.paymentTier,
          totalOwed: parent.totalOwed,
        });
      }

      // ===== ECOSYSTEM SAFETY CHECKS =====
      const daycare = await storage.getDaycare(parsed.daycareId);
      if (daycare?.ecosystemId) {
        const ecosystem = await storage.getEcosystem(daycare.ecosystemId);
        const allAlerts: any[] = [];

        // 1. Check for simultaneous enrollments in same ecosystem
        const simultaneousCheck = await storage.checkSimultaneousEnrollments(parsed.childId);
        if (simultaneousCheck.hasMultipleEnrollments && simultaneousCheck.enrollments.length > 0) {
          const otherDaycare = simultaneousCheck.enrollments.find(e => e.daycareId !== parsed.daycareId);
          if (otherDaycare) {
            allAlerts.push({
              parentId: parent.id,
              daycareId: parsed.daycareId,
              alertType: "simultaneous_enrollment",
              message: `Alert: ${child.firstName} ${child.lastName} is simultaneously enrolled at ${otherDaycare.daycareName} in the same ecosystem`,
              severity: "high",
            });
          }
        }

        // 2. Check for recent transfers after payment issues
        const transferCheck = await storage.checkRecentTransfersAfterDuePayments(parent.id, daycare.ecosystemId, 30);
        if (transferCheck.hasSuspiciousTransfer && transferCheck.detail.length > 0) {
          const transfer = transferCheck.detail[0];
          if (transfer.outstandingPayments > 0) {
            allAlerts.push({
              parentId: parent.id,
              daycareId: parsed.daycareId,
              alertType: "suspicious_transfer",
              message: `Alert: Parent has ${transfer.outstandingPayments} outstanding payment(s) and recently moved ${transfer.childName} from ${transfer.fromDaycare} to another center`,
              severity: "high",
            });
          }
        }

        // Create all alerts
        for (const alert of allAlerts) {
          await storage.createAlert(alert as any);
        }

        // ===== ENFORCEMENT DECISION =====
        // If ecosystem has enforcement enabled AND there are alerts, BLOCK the enrollment
        if (ecosystem?.enforceAlerts && allAlerts.length > 0) {
          return res.status(403).json({
            message: "Enrollment blocked: Suspicious activity detected. Ecosystem is in Enforce mode.",
            alerts: allAlerts,
            enforceMode: true,
            recommendation: "Contact ecosystem admin to resolve or switch to Monitor mode",
          });
        }
      }

      const row = await storage.createEnrollment(parsed);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  // -------- Payments --------
  app.get("/api/payments", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;
      const enrollmentId = req.query.enrollmentId ? Number(req.query.enrollmentId) : undefined;
      const rows = await storage.getPayments(parentId, enrollmentId, req.daycareId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching payments:", e);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Allow admins to create payments across daycares (adminBypass:true)
  app.post("/api/payments", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      console.log('[routes] POST /api/payments called by', req.user?.id, 'body=', req.body);
      // Normalize incoming fields (dueDate/paidDate may be ISO strings or numeric timestamps)
      const incoming = { ...(req.body || {}) } as any;
      // Ensure date fields are numeric timestamps (ms since epoch) as expected by the DB/zod schema
      if (incoming.paidDate) {
        // convert incoming timestamp or ISO string to a Date object (zod/drizzle expects Date)
        if (typeof incoming.paidDate === 'string') {
          const parsed = Date.parse(incoming.paidDate);
          incoming.paidDate = Number.isNaN(parsed) ? undefined : new Date(parsed);
        }
        if (typeof incoming.paidDate === 'number') incoming.paidDate = new Date(Number(incoming.paidDate));
      }
      if (incoming.dueDate) {
        if (typeof incoming.dueDate === 'string') {
          const parsed = Date.parse(incoming.dueDate);
          incoming.dueDate = Number.isNaN(parsed) ? undefined : new Date(parsed);
        }
        if (typeof incoming.dueDate === 'number') incoming.dueDate = new Date(Number(incoming.dueDate));
      }
      if (incoming.amount && typeof incoming.amount === 'string') {
        const n = Number(incoming.amount);
        incoming.amount = Number.isFinite(n) ? n : incoming.amount;
      }
      console.log('[routes] Normalized POST /api/payments payload:', incoming);
      const parsed = insertPaymentSchema.parse(incoming);
      // Optional safety: ensure the enrollment belongs to this daycare
      if (parsed.enrollmentId) {
        const enroll = await storage.getEnrollment(parsed.enrollmentId);
        if (!enroll || enroll.daycareId !== req.daycareId) {
          return res.status(403).json({ message: "Enrollment belongs to another daycare" });
        }
      }
      const row = await storage.createPayment(parsed);
      // Audit: invoice/payment created
      try {
        await storage.addAudit({
          action: "create_invoice",
          actorId: req.user?.id ?? null,
          targetType: "payment",
          targetId: String(row.id),
          daycareId: req.daycareId ?? null,
          payload: { parentId: parsed.parentId, enrollmentId: parsed.enrollmentId, amount: parsed.amount, dueDate: parsed.dueDate },
        });
      } catch (auditErr) {
        console.warn("Failed to write audit log for invoice:", auditErr);
      }
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment record" });
    }
  });

  app.post("/api/payments/:id/payfast-link", isAuthenticated, ensureDaycareFromPayment, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const payment = await storage.getPayment(id);
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      if (!payment.enrollment?.daycare?.ecosystemId) {
        return res.status(400).json({ message: "Payment daycare ecosystem not configured" });
      }

      const ecosystem = await storage.getEcosystem(payment.enrollment.daycare.ecosystemId);
      if (!ecosystem) {
        return res.status(404).json({ message: "Ecosystem not found" });
      }
      if (!ecosystem.payfastMerchantId || !ecosystem.payfastMerchantKey || !ecosystem.payfastPassphrase) {
        return res.status(400).json({ message: "PayFast not configured for this ecosystem" });
      }

      const params: Record<string, string> = {
        merchant_id: ecosystem.payfastMerchantId,
        merchant_key: ecosystem.payfastMerchantKey,
        return_url: process.env.PAYFAST_RETURN_URL || "https://example.com/return",
        cancel_url: process.env.PAYFAST_CANCEL_URL || "https://example.com/cancel",
        notify_url: process.env.PAYFAST_NOTIFY_URL || "https://example.com/api/payfast/ipn",
        m_payment_id: String(payment.id),
        amount: Number(payment.amount).toFixed(2),
        item_name: `Daycare invoice #${payment.id}`,
        email_address: payment.parent?.email ?? "",
      };

      const queryString = Object.keys(params)
        .sort()
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join("&");
      const signature = createHash("md5")
        .update(`${queryString}&passphrase=${ecosystem.payfastPassphrase}`)
        .digest("hex");
      const checkoutUrl = `https://sandbox.payfast.co.za/eng/process?${queryString}&signature=${signature}`;

      const updatedPayment = await storage.updatePayment(payment.id, {
        gatewayProvider: "payfast",
        gatewayStatus: "pending",
        checkoutUrl,
      });
      res.json({ checkoutUrl, payment: updatedPayment });
    } catch (error) {
      console.error("Error creating PayFast checkout link:", error);
      res.status(500).json({ message: "Failed to create PayFast checkout link" });
    }
  });

  app.post("/api/payfast/ipn", async (req: any, res) => {
    try {
      const body = req.body || {};
      const signature = String(body.signature || "").trim();
      const paymentId = Number(body.m_payment_id);
      if (!signature || !paymentId) {
        return res.status(400).send("Invalid PayFast IPN payload");
      }

      const params = { ...body };
      delete params.signature;

      const queryString = Object.keys(params)
        .sort()
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key] ?? ""))}`)
        .join("&");

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        console.warn("PayFast IPN: payment not found", paymentId);
        return res.status(404).send("Payment not found");
      }

      const ecosystemId = payment.enrollment?.daycare?.ecosystemId;
      if (!ecosystemId) {
        console.warn("PayFast IPN: payment has no ecosystem", paymentId);
        return res.status(400).send("Ecosystem not configured");
      }

      const ecosystem = await storage.getEcosystem(ecosystemId);
      if (!ecosystem) {
        return res.status(404).send("Ecosystem not found");
      }

      const expectedSignature = createHash("md5")
        .update(`${queryString}&passphrase=${ecosystem.payfastPassphrase ?? ""}`)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("PayFast IPN invalid signature", { paymentId, expectedSignature, signature });
        return res.status(400).send("Invalid signature");
      }

      const paymentStatus = String(body.payment_status || "").toLowerCase();
      const gatewayStatus = paymentStatus === "complete" ? "complete" : paymentStatus === "failed" ? "failed" : "pending";
      const updatedFields: any = {
        gatewayStatus,
        gatewayReference: body.pf_payment_id ? String(body.pf_payment_id) : null,
      };

      if (gatewayStatus === "complete") {
        updatedFields.status = "paid";
        updatedFields.paidDate = new Date().toISOString();
      }

      const updatedPayment = await storage.updatePayment(paymentId, updatedFields);

      try {
        await storage.addAudit({
          action: "payfast_ipn",
          actorId: null,
          targetType: "payment",
          targetId: String(paymentId),
          daycareId: payment.enrollment?.daycare?.id ?? null,
          payload: {
            payment_status: body.payment_status,
            pf_payment_id: body.pf_payment_id,
            gatewayStatus,
          },
        });
      } catch (auditErr) {
        console.warn("PayFast IPN audit error", auditErr);
      }

      res.send("OK");
    } catch (error) {
      console.error("PayFast IPN error:", error);
      res.status(500).send("PayFast IPN processing failed");
    }
  });

  // For payment updates: try to infer daycareId from the payment record when the client
  // doesn't supply it. This helps client-side callers that don't know the daycareId.
  async function ensureDaycareFromPayment(req: any, res: any, next: any) {
    try {
      const rawDaycare = (req.params && req.params.daycareId) || (req.query && req.query.daycareId) || (req.body && req.body.daycareId) || (req as any).daycareId;
      if (rawDaycare && !Number.isNaN(Number(rawDaycare))) {
        (req as any).daycareId = Number(rawDaycare);
        return next();
      }

      const id = Number(req.params.id);
      if (!id || Number.isNaN(id)) return next();

      const details = await storage.getPayment(id);
      if (details && details.enrollment && details.enrollment.daycare && details.enrollment.daycare.id) {
        (req as any).daycareId = Number(details.enrollment.daycare.id);
        // also mirror into body so downstream handlers/middlewares that read req.body.daycareId will see it
        req.body = req.body || {};
        req.body.daycareId = Number(details.enrollment.daycare.id);
      }
    } catch (e) {
      console.warn('Could not infer daycareId from payment:', e);
    }
    return next();
  }

  // Log the resolved daycare and caller info immediately before the membership check
  // so we can diagnose 403 responses (membership missing vs unauthorized).
  function logMembershipCheck(req: any, _res: any, next: any) {
    try {
      console.log('[routes] membership-check: user=', { id: req.user?.id, role: req.user?.role, activeDaycareId: req.user?.activeDaycareId });
      console.log('[routes] membership-check: resolved daycareId (params/query/body/derived)=', {
        params: req.params?.daycareId,
        query: req.query?.daycareId,
        body: req.body?.daycareId,
        derived: req.daycareId,
      });
    } catch (e) {
      console.warn('Error logging membership check info', e);
    }
    next();
  }

  // Allow admins to bypass daycare membership checks for payment updates
  // (admins manage across daycares). Insert a short logger to capture the
  // resolved daycareId and user role to help debug 403 responses.
  app.put("/api/payments/:id", isAuthenticated, ensureDaycareFromPayment, logMembershipCheck, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      console.log('[routes] PUT /api/payments/:id called by', req.user?.id, 'id=', id, 'body=', req.body);
      // Normalize date/number fields coming from JSON payloads (forms often send ISO strings)
      const incoming = { ...(req.body || {}) } as any;
      // Normalize to numeric timestamps to match insertPaymentSchema (integers representing ms since epoch)
      if (incoming.paidDate) {
        if (typeof incoming.paidDate === "string") {
          const parsed = Date.parse(incoming.paidDate);
          incoming.paidDate = Number.isNaN(parsed) ? undefined : new Date(parsed);
        }
        if (typeof incoming.paidDate === "number") incoming.paidDate = new Date(Number(incoming.paidDate));
      }
      if (incoming.dueDate) {
        if (typeof incoming.dueDate === "string") {
          const parsed = Date.parse(incoming.dueDate);
          incoming.dueDate = Number.isNaN(parsed) ? undefined : new Date(parsed);
        }
        if (typeof incoming.dueDate === "number") incoming.dueDate = new Date(Number(incoming.dueDate));
      }
      if (incoming.amount && typeof incoming.amount === "string") {
        const n = Number(incoming.amount);
        incoming.amount = Number.isFinite(n) ? n : incoming.amount;
      }
      console.log('[routes] Normalized payment payload:', incoming);
      const data = insertPaymentSchema.partial().parse(incoming);
      const payment = await storage.updatePayment(id, data);

      if (data.status === "paid") {
        const details = await storage.getPayment(id);
        if (details) {
          const all = await storage.getPayments(details.parent.id);
          const overdue = all.filter((p) => p.status === "overdue").length;
          const total = all.length;
          let newTier = "good_payer";
          if (overdue > total * 0.5) newTier = "non_payer";
          else if (overdue > total * 0.2) newTier = "mid_payer";

          const totalOwed = all
            .filter((p) => p.status !== "paid")
            .reduce((sum, p) => sum + Number(p.amount), 0);

          await storage.updateParentTier(details.parent.id, newTier, totalOwed);
        }
      }

      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error updating payment:", error.errors);
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // -------- Alerts --------
  app.get("/api/alerts", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      const resolved =
        typeof req.query.resolved === "string"
          ? req.query.resolved === "true"
          : undefined;
      const rows = await storage.getAlerts(resolved, req.daycareId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching alerts:", e);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Allow admins to create alerts across daycares (adminBypass:true)
  app.post("/api/alerts", isAuthenticated, requireMembership("daycareId", { adminBypass: true }), async (req: any, res) => {
    try {
      console.log('[routes] POST /api/alerts called by', req.user?.id, 'body=', req.body);
      const parsed = insertPaymentAlertSchema.parse({ ...req.body, daycareId: req.daycareId });
      const row = await storage.createAlert(parsed);
      // Audit: alert created
      try {
        await storage.addAudit({
          action: "create_alert",
          actorId: req.user?.id ?? null,
          targetType: "alert",
          targetId: String(row.id),
          daycareId: req.daycareId ?? null,
          payload: { parentId: parsed.parentId, alertType: parsed.alertType, message: parsed.message, severity: parsed.severity },
        });
      } catch (auditErr) {
        console.warn("Failed to write audit log for alert:", auditErr);
      }
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.put("/api/alerts/:id/resolve", isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const resolvedBy = `${req.user?.firstName ?? ""} ${req.user?.lastName ?? ""}`.trim() || "System";
      const row = await storage.resolveAlert(id, resolvedBy);
      res.json(row);
    } catch (e) {
      console.error("Error resolving alert:", e);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}