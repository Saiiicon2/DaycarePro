var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  children: () => children,
  childrenRelations: () => childrenRelations,
  daycares: () => daycares,
  daycaresRelations: () => daycaresRelations,
  enrollments: () => enrollments,
  enrollmentsRelations: () => enrollmentsRelations,
  insertChildSchema: () => insertChildSchema,
  insertDaycareSchema: () => insertDaycareSchema,
  insertEnrollmentSchema: () => insertEnrollmentSchema,
  insertMembershipSchema: () => insertMembershipSchema,
  insertParentSchema: () => insertParentSchema,
  insertPaymentAlertSchema: () => insertPaymentAlertSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  membershipSchema: () => membershipSchema,
  memberships: () => memberships,
  membershipsRelations: () => membershipsRelations,
  parents: () => parents,
  parentsRelations: () => parentsRelations,
  paymentAlerts: () => paymentAlerts,
  paymentAlertsRelations: () => paymentAlertsRelations,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  sessions: () => sessions,
  upsertUserSchema: () => upsertUserSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  sqliteTable,
  text,
  integer,
  real,
  blob
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var insertMembershipSchema, membershipSchema, sessions, users, daycares, memberships, parents, children, enrollments, payments, paymentAlerts, usersRelations, daycaresRelations, membershipsRelations, parentsRelations, childrenRelations, enrollmentsRelations, paymentsRelations, paymentAlertsRelations, upsertUserSchema, insertDaycareSchema, insertParentSchema, insertChildSchema, insertEnrollmentSchema, insertPaymentSchema, insertPaymentAlertSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    insertMembershipSchema = z.object({
      userId: z.string().min(1),
      daycareId: z.number().int().positive(),
      role: z.enum(["daycare", "manager", "admin"]).default("daycare"),
      isActive: z.boolean().default(true)
    });
    membershipSchema = insertMembershipSchema.extend({
      id: z.number().int(),
      createdAt: z.number().int(),
      updatedAt: z.number().int()
    });
    sessions = sqliteTable("sessions", {
      sid: text("sid").primaryKey(),
      sess: blob("sess", { mode: "json" }).notNull(),
      expire: integer("expire", { mode: "timestamp" }).notNull()
    });
    users = sqliteTable("users", {
      id: text("id").primaryKey(),
      email: text("email").unique(),
      password: text("password").notNull(),
      firstName: text("first_name"),
      lastName: text("last_name"),
      profileImageUrl: text("profile_image_url"),
      role: text("role").notNull().default("staff"),
      // ⬅️ global role default
      daycareId: integer("daycare_id"),
      // legacy (migration only)
      activeDaycareId: integer("active_daycare_id"),
      // ⬅️ current org context
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow()
    });
    daycares = sqliteTable("daycares", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      address: text("address").notNull(),
      phone: text("phone"),
      email: text("email"),
      licenseNumber: text("license_number"),
      capacity: integer("capacity"),
      isActive: integer("is_active", { mode: "boolean" }).default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow()
    });
    memberships = sqliteTable("memberships", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull(),
      daycareId: integer("daycare_id").notNull(),
      role: text("role").notNull().default("owner"),
      // 'owner' | 'staff'
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow()
    });
    parents = sqliteTable("parents", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      email: text("email").notNull().unique(),
      phone: text("phone"),
      address: text("address"),
      emergencyContact: text("emergency_contact"),
      paymentTier: text("payment_tier").notNull().default("good_payer"),
      totalOwed: real("total_owed").default(0),
      notes: text("notes"),
      isBlacklisted: integer("is_blacklisted", { mode: "boolean" }).default(false),
      daycareId: integer("daycare_id"),
      // ⬅️ scope to org
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow()
    });
    children = sqliteTable("children", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
      parentId: integer("parent_id").notNull(),
      currentDaycareId: integer("current_daycare_id"),
      allergies: text("allergies"),
      medicalNotes: text("medical_notes"),
      emergencyContacts: text("emergency_contacts"),
      isActive: integer("is_active", { mode: "boolean" }).default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow()
    });
    enrollments = sqliteTable("enrollments", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      childId: integer("child_id").notNull(),
      daycareId: integer("daycare_id").notNull(),
      startDate: integer("start_date", { mode: "timestamp" }).notNull(),
      endDate: integer("end_date", { mode: "timestamp" }),
      monthlyFee: real("monthly_fee").notNull(),
      status: text("status").notNull().default("active"),
      reasonForLeaving: text("reason_for_leaving"),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow()
    });
    payments = sqliteTable("payments", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      enrollmentId: integer("enrollment_id").notNull(),
      parentId: integer("parent_id").notNull(),
      amount: real("amount").notNull(),
      dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
      paidDate: integer("paid_date", { mode: "timestamp" }),
      status: text("status").notNull().default("pending"),
      paymentMethod: text("payment_method"),
      notes: text("notes"),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow()
    });
    paymentAlerts = sqliteTable("payment_alerts", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      parentId: integer("parent_id").notNull(),
      daycareId: integer("daycare_id").notNull(),
      alertType: text("alert_type").notNull(),
      message: text("message").notNull(),
      severity: text("severity").notNull().default("medium"),
      isResolved: integer("is_resolved", { mode: "boolean" }).default(false),
      resolvedBy: text("resolved_by"),
      resolvedAt: integer("resolved_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow()
    });
    usersRelations = relations(users, ({ one, many }) => ({
      daycare: one(daycares, { fields: [users.daycareId], references: [daycares.id] }),
      // legacy
      activeDaycare: one(daycares, { fields: [users.activeDaycareId], references: [daycares.id] }),
      memberships: many(memberships)
    }));
    daycaresRelations = relations(daycares, ({ many }) => ({
      users: many(users),
      memberships: many(memberships),
      enrollments: many(enrollments),
      alerts: many(paymentAlerts)
    }));
    membershipsRelations = relations(memberships, ({ one }) => ({
      user: one(users, { fields: [memberships.userId], references: [users.id] }),
      daycare: one(daycares, { fields: [memberships.daycareId], references: [daycares.id] })
    }));
    parentsRelations = relations(parents, ({ one, many }) => ({
      daycare: one(daycares, { fields: [parents.daycareId], references: [daycares.id] }),
      // ⬅️ added
      children: many(children),
      payments: many(payments),
      alerts: many(paymentAlerts)
    }));
    childrenRelations = relations(children, ({ one, many }) => ({
      parent: one(parents, { fields: [children.parentId], references: [parents.id] }),
      currentDaycare: one(daycares, { fields: [children.currentDaycareId], references: [daycares.id] }),
      enrollments: many(enrollments)
    }));
    enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
      child: one(children, { fields: [enrollments.childId], references: [children.id] }),
      daycare: one(daycares, { fields: [enrollments.daycareId], references: [daycares.id] }),
      payments: many(payments)
    }));
    paymentsRelations = relations(payments, ({ one }) => ({
      enrollment: one(enrollments, { fields: [payments.enrollmentId], references: [enrollments.id] }),
      parent: one(parents, { fields: [payments.parentId], references: [parents.id] })
    }));
    paymentAlertsRelations = relations(paymentAlerts, ({ one }) => ({
      parent: one(parents, { fields: [paymentAlerts.parentId], references: [parents.id] }),
      daycare: one(daycares, { fields: [paymentAlerts.daycareId], references: [daycares.id] })
    }));
    upsertUserSchema = createInsertSchema(users);
    insertDaycareSchema = createInsertSchema(daycares);
    insertParentSchema = createInsertSchema(parents);
    insertChildSchema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
      parentId: z.number().int().positive(),
      createdAt: z.number(),
      currentDaycareId: z.number().optional(),
      allergies: z.string().optional(),
      medicalNotes: z.string().optional(),
      emergencyContacts: z.string().optional(),
      isActive: z.boolean().optional(),
      updatedAt: z.number()
    });
    insertEnrollmentSchema = createInsertSchema(enrollments);
    insertPaymentSchema = createInsertSchema(payments);
    insertPaymentAlertSchema = createInsertSchema(paymentAlerts);
  }
});

// server/db.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
var sqlite, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    sqlite = new Database("./server/db.sqlite");
    db = drizzle(sqlite, { schema: schema_exports });
  }
});

// server/localAuth.ts
var localAuth_exports = {};
__export(localAuth_exports, {
  isAuthenticated: () => isAuthenticated,
  setupLocalAuth: () => setupLocalAuth
});
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq as eq3, and as and3 } from "drizzle-orm";
function isAdmin2(u) {
  return u?.role === "admin" || u?.role === "system_admin";
}
function isOwner(u) {
  return u?.role === "owner";
}
function canCreateDaycare(u) {
  return isAdmin2(u) || isOwner(u);
}
async function loadMembershipsForUser(userId) {
  const rows = await db.select({
    daycareId: memberships.daycareId,
    role: memberships.role,
    daycareName: daycares.name
  }).from(memberships).leftJoin(daycares, eq3(memberships.daycareId, daycares.id)).where(eq3(memberships.userId, userId));
  return rows.map((r) => ({
    daycareId: r.daycareId,
    daycareName: r.daycareName ?? null,
    role: r.role ?? "staff"
  }));
}
async function buildSessionUser(u) {
  const m = await loadMembershipsForUser(u.id);
  let active = u.activeDaycareId ?? null;
  if (!active || !m.some((x) => x.daycareId === active)) {
    active = m.length ? m[0].daycareId : null;
  }
  return {
    id: u.id,
    email: u.email ?? null,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    role: u.role ?? "staff",
    activeDaycareId: active,
    memberships: m
  };
}
async function persistActive(userId, daycareId) {
  await db.update(users).set({ activeDaycareId: daycareId ?? null, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, userId));
}
function setupLocalAuth(app2) {
  app2.post("/api/auth/register-daycare", async (req, res) => {
    const daycareName = norm(req.body.daycareName);
    const address = norm(req.body.address);
    const daycareEmail = normEmail(req.body.daycareEmail);
    const phone = norm(req.body.phone) || null;
    const licenseNumber = norm(req.body.licenseNumber) || null;
    const capacityRaw = req.body.capacity;
    const capacity = capacityRaw === void 0 || capacityRaw === null || capacityRaw === "" ? null : Number(capacityRaw);
    const email = normEmail(req.body.email);
    const password = String(req.body.password ?? "");
    const firstName = norm(req.body.firstName) || null;
    const lastName = norm(req.body.lastName) || null;
    if (!daycareName || !address) {
      return res.status(400).json({ message: "Missing fields (daycareName, address)" });
    }
    if (Number.isNaN(capacity)) {
      return res.status(400).json({ message: "capacity must be a number if provided" });
    }
    const loggedIn = !!req.session?.user;
    try {
      if (loggedIn && !canCreateDaycare(req.session.user)) {
        return res.status(403).json({ message: "Only admin/owner can create new daycares" });
      }
      const [existingDc] = await db.select({ id: daycares.id }).from(daycares).where(and3(eq3(daycares.name, daycareName), eq3(daycares.address, address)));
      if (existingDc) {
        return res.status(409).json({ message: "A daycare with this name & address already exists" });
      }
      const result = db.transaction((tx) => {
        const dcInsert = tx.insert(daycares).values({
          name: daycareName,
          address,
          phone,
          email: daycareEmail || null,
          licenseNumber,
          capacity: capacity ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).run();
        const daycareId = Number(dcInsert.lastInsertRowid);
        let createdUser = void 0;
        if (loggedIn) {
          const currentUser = req.session.user;
          const [u] = tx.select().from(users).where(eq3(users.id, currentUser.id)).all();
          if (!u) throw new Error("Current user not found");
          tx.insert(memberships).values({
            userId: u.id,
            daycareId,
            role: "owner",
            createdAt: /* @__PURE__ */ new Date()
          }).run();
          if (!u.activeDaycareId) {
            tx.update(users).set({ activeDaycareId: daycareId, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, u.id)).run();
          }
        } else {
          if (!email || !password) {
            throw new Error("Missing email or password for first owner");
          }
          const [existingUser] = tx.select({ id: users.id }).from(users).where(eq3(users.email, email)).all();
          if (existingUser) throw new Error("Email already in use");
          const userId = randomUUID();
          const hashed = bcrypt.hashSync(password, 10);
          tx.insert(users).values({
            id: userId,
            email,
            password: hashed,
            firstName,
            lastName,
            role: "owner",
            // global role
            activeDaycareId: daycareId,
            // start in this org
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).run();
          tx.insert(memberships).values({
            userId,
            daycareId,
            role: "owner",
            createdAt: /* @__PURE__ */ new Date()
          }).run();
          createdUser = tx.select().from(users).where(eq3(users.id, userId)).all()[0];
        }
        const dc = tx.select().from(daycares).where(eq3(daycares.id, daycareId)).all()[0];
        return { daycare: dc, createdUser, daycareId };
      });
      if (result.createdUser) {
        const sessionUser = await buildSessionUser(result.createdUser);
        req.session.user = sessionUser;
        return res.json({ user: sessionUser, daycare: result.daycare });
      }
      const [freshUser] = await db.select().from(users).where(eq3(users.id, req.session.user.id));
      const refreshed = await buildSessionUser(freshUser);
      req.session.user = refreshed;
      return res.json({ user: refreshed, daycare: result.daycare });
    } catch (e) {
      console.error("register-daycare error", e);
      if (e?.message === "Email already in use") return res.status(409).json({ message: e.message });
      if (e?.message === "Missing email or password for first owner") return res.status(400).json({ message: e.message });
      return res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    const email = normEmail(req.body.email);
    const password = String(req.body.password ?? "");
    try {
      const [u] = await db.select({
        id: users.id,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        activeDaycareId: users.activeDaycareId
      }).from(users).where(eq3(users.email, email));
      if (!u) return res.status(401).json({ message: "Invalid credentials" });
      const ok = await bcrypt.compare(password, u.password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });
      let activeDaycareId = u.activeDaycareId ?? null;
      if (!activeDaycareId) {
        const ms = await db.select().from(memberships).where(eq3(memberships.userId, u.id));
        if (ms.length) {
          activeDaycareId = ms[0].daycareId;
          await db.update(users).set({ activeDaycareId, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, u.id));
        }
      }
      const sessionUser = await buildSessionUser({ ...u, activeDaycareId });
      req.session.user = sessionUser;
      res.json(sessionUser);
    } catch (error) {
      console.error("\u{1F6A8} Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/switch-daycare", async (req, res) => {
    const u = req.session?.user;
    if (!u) return res.status(401).json({ message: "Not authenticated" });
    const daycareId = Number(req.body.daycareId);
    if (!daycareId) return res.status(400).json({ message: "daycareId required" });
    const allowed = isAdmin2(u) || u.memberships.some((m) => m.daycareId === daycareId);
    if (!allowed) return res.status(403).json({ message: "Not a member of that daycare" });
    await persistActive(u.id, daycareId);
    const [freshUser] = await db.select().from(users).where(eq3(users.id, u.id));
    const sessionUser = await buildSessionUser(freshUser);
    req.session.user = sessionUser;
    res.json(sessionUser);
  });
  app2.get("/api/auth/memberships", async (req, res) => {
    const u = req.session?.user;
    if (!u) return res.status(401).json({ message: "Not authenticated" });
    const list = await loadMembershipsForUser(u.id);
    res.json({ activeDaycareId: u.activeDaycareId, memberships: list });
  });
  app2.get("/api/auth/user", (req, res) => {
    const user = req.session?.user;
    if (user) return res.json(user);
    return res.status(401).json({ message: "Not authenticated" });
  });
  app2.post("/api/auth/logout", (req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        path: "/"
      });
      res.json({ ok: true });
    });
  });
}
var isProd, norm, normEmail, isAuthenticated;
var init_localAuth = __esm({
  "server/localAuth.ts"() {
    "use strict";
    init_db();
    init_schema();
    isProd = process.env.NODE_ENV === "production";
    norm = (s) => (s ?? "").trim();
    normEmail = (s) => norm(s).toLowerCase();
    isAuthenticated = (req, res, next) => {
      const user = req.session?.user;
      if (user) {
        req.user = user;
        return next();
      }
      return res.status(401).json({ message: "Unauthorized" });
    };
  }
});

// server/index.ts
import express2 from "express";
import session from "express-session";
import cors from "cors";
import "dotenv/config";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_schema();
init_db();
import { eq, desc, and, sql, or } from "drizzle-orm";
var DatabaseStorage = class {
  async getMemberships(userId) {
    return await db.select().from(memberships).where(eq(memberships.userId, userId));
  }
  async addMembership(userId, daycareId, role = "daycare") {
    const [row] = await db.insert(memberships).values({ userId, daycareId, role, isActive: true }).onConflictDoNothing().returning();
    return row;
  }
  async removeMembership(userId, daycareId) {
    await db.delete(memberships).where(and(
      eq(memberships.userId, userId),
      eq(memberships.daycareId, daycareId)
    ));
  }
  async userCanAccessDaycare(userId, daycareId) {
    const [row] = await db.select({ id: memberships.id }).from(memberships).where(and(
      eq(memberships.userId, userId),
      eq(memberships.daycareId, daycareId),
      eq(memberships.isActive, true)
    )).limit(1);
    return !!row;
  }
  async getUsers() {
    return await db.select().from(users);
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  // User operations (required for Replit Auth)
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      password: users.password,
      // ✅ include this explicitly
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      daycareId: users.daycareId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.email, email));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Daycare operations
  async getDaycares() {
    return await db.select().from(daycares).where(eq(daycares.isActive, true)).orderBy(daycares.name);
  }
  async getDaycare(id) {
    const [daycare] = await db.select().from(daycares).where(eq(daycares.id, id));
    return daycare;
  }
  async createDaycare(daycare) {
    const [newDaycare] = await db.insert(daycares).values(daycare).returning();
    return newDaycare;
  }
  async updateDaycare(id, daycare) {
    const [updatedDaycare] = await db.update(daycares).set({ ...daycare, updatedAt: /* @__PURE__ */ new Date() }).where(eq(daycares.id, id)).returning();
    return updatedDaycare;
  }
  // Parents
  async getParents(search, daycareId) {
    const conds = [];
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      conds.push(
        or(
          sql`lower(${parents.firstName}) LIKE ${term}`,
          sql`lower(${parents.lastName})  LIKE ${term}`,
          sql`lower(${parents.email})     LIKE ${term}`
        )
      );
    }
    if (daycareId) conds.push(eq(parents.daycareId, daycareId));
    if (conds.length) {
      return await db.select().from(parents).where(and(...conds)).orderBy(parents.lastName, parents.firstName);
    } else {
      return await db.select().from(parents).orderBy(parents.lastName, parents.firstName);
    }
  }
  async getParent(id) {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent;
  }
  async getParentByEmail(email) {
    console.log("email:", email);
    const [parent] = await db.select().from(parents).where(eq(parents.email, email));
    return parent;
  }
  async getParentWithChildren(id) {
    const parent = await this.getParent(id);
    if (!parent) return void 0;
    const childrenList = await db.select().from(children).where(eq(children.parentId, id));
    return {
      ...parent,
      children: childrenList
    };
  }
  async createParent(parent) {
    const [newParent] = await db.insert(parents).values(parent).returning();
    return newParent;
  }
  async updateParent(id, parent) {
    const [updatedParent] = await db.update(parents).set({ ...parent, updatedAt: /* @__PURE__ */ new Date() }).where(eq(parents.id, id)).returning();
    return updatedParent;
  }
  async updateParentTier(id, tier, totalOwed) {
    const [updatedParent] = await db.update(parents).set({
      paymentTier: tier,
      totalOwed,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(parents.id, id)).returning();
    return updatedParent;
  }
  // Child operations
  async getChildren(parentId, daycareId) {
    const conds = [];
    if (parentId) conds.push(eq(children.parentId, parentId));
    if (daycareId) conds.push(eq(children.currentDaycareId, daycareId));
    if (conds.length) {
      return await db.select().from(children).where(and(...conds)).orderBy(children.firstName);
    } else {
      return await db.select().from(children).orderBy(children.firstName);
    }
  }
  async getChild(id) {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }
  async createChild(child) {
    console.log(" Incoming child data:", child);
    const parsedChild = {
      ...child,
      createdAt: new Date(Number(child.createdAt)),
      updatedAt: new Date(Number(child.updatedAt)),
      dateOfBirth: new Date(child.dateOfBirth)
      //  convert ISO string to Date
    };
    console.log(" Parsed child data before insert:", parsedChild);
    const [newChild] = await db.insert(children).values(parsedChild).returning();
    return newChild;
  }
  async updateChild(id, child) {
    const [updatedChild] = await db.update(children).set({ ...child, updatedAt: /* @__PURE__ */ new Date() }).where(eq(children.id, id)).returning();
    return updatedChild;
  }
  // Enrollment operations
  async getEnrollments(daycareId) {
    const base = db.select({
      enrollment: enrollments,
      child: children,
      daycare: daycares
    }).from(enrollments).leftJoin(children, eq(enrollments.childId, children.id)).leftJoin(daycares, eq(enrollments.daycareId, daycares.id));
    const q = daycareId ? base.where(eq(enrollments.daycareId, daycareId)) : base;
    const results = await q.orderBy(desc(enrollments.startDate));
    return results.map((r) => ({
      ...r.enrollment,
      child: r.child,
      daycare: r.daycare,
      payments: []
      // populate lazily if/when needed
    }));
  }
  async createEnrollment(enrollment) {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }
  async updateEnrollment(id, enrollment) {
    const [updatedEnrollment] = await db.update(enrollments).set({ ...enrollment, updatedAt: /* @__PURE__ */ new Date() }).where(eq(enrollments.id, id)).returning();
    return updatedEnrollment;
  }
  // Payment operations
  async getPayments(parentId, enrollmentId, daycareId) {
    const conds = [];
    if (parentId) conds.push(eq(payments.parentId, parentId));
    if (enrollmentId) conds.push(eq(payments.enrollmentId, enrollmentId));
    if (daycareId) conds.push(eq(enrollments.daycareId, daycareId));
    const base = db.select({
      payment: payments,
      enrollment: enrollments,
      child: children,
      daycare: daycares,
      parent: parents
    }).from(payments).leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id)).leftJoin(children, eq(enrollments.childId, children.id)).leftJoin(daycares, eq(enrollments.daycareId, daycares.id)).leftJoin(parents, eq(payments.parentId, parents.id));
    const q = conds.length ? base.where(and(...conds)) : base;
    const results = await q.orderBy(desc(payments.dueDate));
    return results.map((r) => ({
      ...r.payment,
      enrollment: { ...r.enrollment, child: r.child, daycare: r.daycare },
      parent: r.parent
    }));
  }
  async getPayment(id) {
    const [result] = await db.select({
      payment: payments,
      enrollment: enrollments,
      child: children,
      daycare: daycares,
      parent: parents
    }).from(payments).leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id)).leftJoin(children, eq(enrollments.childId, children.id)).leftJoin(daycares, eq(enrollments.daycareId, daycares.id)).leftJoin(parents, eq(payments.parentId, parents.id)).where(eq(payments.id, id));
    if (!result) return void 0;
    return {
      ...result.payment,
      enrollment: {
        ...result.enrollment,
        child: result.child,
        daycare: result.daycare
      },
      parent: result.parent
    };
  }
  //   async getMemberships(userId: string) {
  //   return await db.select().from(memberships).where(eq(memberships.userId, userId));
  // }
  async createPayment(payment) {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }
  async updatePayment(id, payment) {
    const [updatedPayment] = await db.update(payments).set({ ...payment, updatedAt: /* @__PURE__ */ new Date() }).where(eq(payments.id, id)).returning();
    return updatedPayment;
  }
  // Alert operations
  async getAlerts(resolved, daycareId) {
    const conds = [];
    if (resolved !== void 0) conds.push(eq(paymentAlerts.isResolved, resolved));
    if (daycareId) conds.push(eq(paymentAlerts.daycareId, daycareId));
    const base = db.select({ alert: paymentAlerts, parent: parents, daycare: daycares }).from(paymentAlerts).leftJoin(parents, eq(paymentAlerts.parentId, parents.id)).leftJoin(daycares, eq(paymentAlerts.daycareId, daycares.id));
    const q = conds.length ? base.where(and(...conds)) : base;
    const results = await q.orderBy(desc(paymentAlerts.createdAt));
    return results.map((r) => ({ ...r.alert, parent: r.parent, daycare: r.daycare }));
  }
  async createAlert(alert) {
    const [newAlert] = await db.insert(paymentAlerts).values(alert).returning();
    return newAlert;
  }
  async resolveAlert(id, resolvedBy) {
    const [resolvedAlert] = await db.update(paymentAlerts).set({
      isResolved: true,
      resolvedBy,
      resolvedAt: /* @__PURE__ */ new Date()
    }).where(eq(paymentAlerts.id, id)).returning();
    return resolvedAlert;
  }
  // Analytics
  async getDashboardStats() {
    const [totalParents] = await db.select({ count: sql`count(*)` }).from(parents);
    const [goodPayers] = await db.select({ count: sql`count(*)` }).from(parents).where(eq(parents.paymentTier, "good_payer"));
    const [midPayers] = await db.select({ count: sql`count(*)` }).from(parents).where(eq(parents.paymentTier, "mid_payer"));
    const [nonPayers] = await db.select({ count: sql`count(*)` }).from(parents).where(eq(parents.paymentTier, "non_payer"));
    return {
      totalParents: totalParents.count,
      goodPayers: goodPayers.count,
      midPayers: midPayers.count,
      nonPayers: nonPayers.count
    };
  }
};
var storage = new DatabaseStorage();

// server/middleware/requireMembership.ts
init_db();
init_schema();
import { and as and2, eq as eq2 } from "drizzle-orm";
function isAdmin(u) {
  return u?.role === "admin" || u?.role === "system_admin";
}
function requireMembership(param = "daycareId", opts = {}) {
  const { adminBypass = false } = opts;
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });
      if (adminBypass && isAdmin(user)) {
        const raw2 = req.params[param] ?? req.query[param] ?? req.body[param] ?? req.user?.activeDaycareId;
        const maybe = Number(raw2);
        if (raw2 && !Number.isNaN(maybe)) req.daycareId = maybe;
        return next();
      }
      const raw = req.params[param] ?? req.query[param] ?? req.body[param] ?? req.user?.activeDaycareId;
      const daycareId = Number(raw);
      if (!daycareId || Number.isNaN(daycareId)) {
        return res.status(400).json({ message: "daycareId required" });
      }
      const [row] = await db.select({ id: memberships.id }).from(memberships).where(
        and2(
          eq2(memberships.userId, user.id),
          eq2(memberships.daycareId, daycareId),
          eq2(memberships.isActive, true)
        )
      ).limit(1);
      if (!row) return res.status(403).json({ message: "No access to this daycare" });
      req.daycareId = daycareId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// server/routes.ts
init_schema();
import { z as z2 } from "zod";
var isAdmin3 = (u) => u?.role === "admin" || u?.role === "system_admin";
async function registerRoutes(app2) {
  const adminOnly = (req, res, next) => {
    const isAdmin4 = req.user?.role === "admin" || req.user?.role === "system_admin";
    if (!isAdmin4) return res.status(403).json({ message: "Admins only" });
    next();
  };
  const { setupLocalAuth: setupLocalAuth2, isAuthenticated: isAuthenticated2 } = await Promise.resolve().then(() => (init_localAuth(), localAuth_exports));
  setupLocalAuth2(app2);
  app2.use(async (req, _res, next) => {
    try {
      if (req.user?.id) {
        const fresh = await storage.getUser(req.user.id);
        if (fresh) req.user = fresh;
      }
    } catch (e) {
      console.error("hydrate user failed:", e);
    }
    next();
  });
  app2.get("/api/auth/user", isAuthenticated2, async (req, res) => {
    res.json(req.user);
  });
  app2.get("/api/dashboard/stats", isAuthenticated2, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });
  app2.get("/api/memberships/me", isAuthenticated2, async (req, res, next) => {
    try {
      const rows = await storage.getMemberships(req.user.id);
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });
  app2.get("/api/daycares", isAuthenticated2, async (_req, res) => {
    try {
      const rows = await storage.getDaycares();
      res.json(rows);
    } catch (e) {
      console.error("Error fetching daycares:", e);
      res.status(500).json({ message: "Failed to fetch daycare centers" });
    }
  });
  app2.get("/api/daycares/:id", isAuthenticated2, async (req, res) => {
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
  app2.post("/api/daycares", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const BodySchema = insertDaycareSchema.extend({
        ownerEmail: z2.string().email().optional()
      });
      const { ownerEmail, ...daycarePayload } = BodySchema.parse(req.body);
      const daycare = await storage.createDaycare(daycarePayload);
      let ownerLinked = false;
      let ownerUserId;
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
        // true if membership created
        ownerUserId: ownerUserId ?? null,
        message: ownerEmail && !ownerLinked ? "Daycare created. No user with that email; assign later." : "Daycare created."
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid daycare data", errors: error.errors });
      }
      console.error("Error creating daycare:", error);
      res.status(500).json({ message: "Failed to create daycare center" });
    }
  });
  app2.put("/api/daycares/:id", isAuthenticated2, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = insertDaycareSchema.partial().parse(req.body);
      const row = await storage.updateDaycare(id, data);
      res.json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid daycare data", errors: error.errors });
      }
      console.error("Error updating daycare:", error);
      res.status(500).json({ message: "Failed to update daycare center" });
    }
  });
  app2.get("/api/parents", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : void 0;
      const list = await storage.getParents(search, req.daycareId);
      res.json(list);
    } catch (e) {
      console.error("Error fetching parents:", e);
      res.status(500).json({ message: "Failed to fetch parents" });
    }
  });
  app2.get("/api/parents/:id", isAuthenticated2, requireMembership(), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parent = await storage.getParentWithChildren(id);
      if (!parent) return res.status(404).json({ message: "Parent not found" });
      res.json(parent);
    } catch (e) {
      console.error("Error fetching parent:", e);
      res.status(500).json({ message: "Failed to fetch parent" });
    }
  });
  app2.post(
    "/api/parents",
    isAuthenticated2,
    requireMembership("daycareId", { adminBypass: true }),
    async (req, res) => {
      try {
        const u = req.user;
        const raw = insertParentSchema.parse(req.body);
        const email = String(raw.email || "").trim().toLowerCase();
        const resolvedDaycareId = !isAdmin3(u) ? req.daycareId : raw.daycareId ?? req.daycareId;
        if (!resolvedDaycareId) {
          return res.status(400).json({ message: "Please choose a daycare for this parent (daycareId)." });
        }
        const existing = await storage.getParentByEmail(email);
        if (existing && !isAdmin3(u) && existing.daycareId !== resolvedDaycareId) {
          return res.status(409).json({
            message: "Parent already exists at another daycare",
            existingParentId: existing.id,
            existingDaycareId: existing.daycareId
          });
        }
        if (existing && existing.daycareId === resolvedDaycareId) {
          return res.status(409).json({
            message: "Parent already exists in this daycare",
            existingParentId: existing.id
          });
        }
        const payload = {
          ...raw,
          email,
          daycareId: resolvedDaycareId
        };
        const parent = await storage.createParent(payload);
        return res.status(201).json(parent);
      } catch (error) {
        if (error instanceof z2.ZodError) {
          return res.status(400).json({ message: "Invalid parent data", errors: error.errors });
        }
        console.error("Error creating parent:", error);
        return res.status(500).json({ message: "Failed to create parent" });
      }
    }
  );
  app2.put("/api/parents/:id", isAuthenticated2, requireMembership(), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = insertParentSchema.partial().parse(req.body);
      const row = await storage.updateParent(id, data);
      res.json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid parent data", errors: error.errors });
      }
      console.error("Error updating parent:", error);
      res.status(500).json({ message: "Failed to update parent" });
    }
  });
  app2.get("/api/children", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : void 0;
      const list = await storage.getChildren(parentId, req.daycareId);
      res.json(list);
    } catch (e) {
      console.error("Error fetching children:", e);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });
  app2.post("/api/children", isAuthenticated2, requireMembership(), async (req, res) => {
    try {
      const parsed = insertChildSchema.parse(req.body);
      const parent = await storage.getParent(parsed.parentId);
      if (!parent) return res.status(404).json({ message: "Parent not found" });
      if (!isAdmin3(req.user) && parent.daycareId !== req.daycareId) {
        return res.status(403).json({ message: "Parent belongs to a different daycare" });
      }
      const payload = isAdmin3(req.user) ? { ...parsed, currentDaycareId: parsed.currentDaycareId ?? parent.daycareId ?? null } : { ...parsed, currentDaycareId: req.daycareId };
      const row = await storage.createChild(payload);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid child data", errors: error.errors });
      }
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child profile" });
    }
  });
  app2.post("/api/parents/lookup", isAuthenticated2, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required for lookup" });
      const parent = await storage.getParentByEmail(String(email).trim().toLowerCase());
      if (!parent) return res.status(404).json({ message: "Parent not found in ecosystem" });
      const payments2 = await storage.getPayments(parent.id);
      res.json({
        parent,
        paymentHistory: payments2,
        recommendation: parent.paymentTier === "non_payer" ? "REJECT" : parent.paymentTier === "mid_payer" ? "CAUTION" : "APPROVE"
      });
    } catch (e) {
      console.error("Error in parent lookup:", e);
      res.status(500).json({ message: "Failed to perform parent lookup" });
    }
  });
  app2.get("/api/enrollments", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      const rows = await storage.getEnrollments(req.daycareId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching enrollments:", e);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  app2.post("/api/enrollments", isAuthenticated2, requireMembership(), async (req, res) => {
    try {
      const parsed = insertEnrollmentSchema.parse({ ...req.body, daycareId: req.daycareId });
      const child = await storage.getChild(parsed.childId);
      if (!child) return res.status(404).json({ message: "Child not found" });
      const parent = await storage.getParent(child.parentId);
      if (!parent) return res.status(404).json({ message: "Parent not found" });
      if (parent.paymentTier === "non_payer" || parent.isBlacklisted) {
        await storage.createAlert({
          parentId: parent.id,
          daycareId: parsed.daycareId,
          alertType: "enrollment_attempt",
          message: `${parent.firstName} ${parent.lastName} attempted enrollment with ${parent.paymentTier} status`,
          severity: parent.paymentTier === "non_payer" ? "high" : "medium"
        });
        return res.status(400).json({
          message: "Enrollment blocked due to payment history",
          parentTier: parent.paymentTier,
          totalOwed: parent.totalOwed
        });
      }
      const row = await storage.createEnrollment(parsed);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });
  app2.get("/api/payments", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : void 0;
      const enrollmentId = req.query.enrollmentId ? Number(req.query.enrollmentId) : void 0;
      const rows = await storage.getPayments(parentId, enrollmentId, req.daycareId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching payments:", e);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  app2.post("/api/payments", isAuthenticated2, requireMembership(), async (req, res) => {
    try {
      const parsed = insertPaymentSchema.parse(req.body);
      if (parsed.enrollmentId) {
        const enroll = await storage.getEnrollment(parsed.enrollmentId);
        if (!enroll || enroll.daycareId !== req.daycareId) {
          return res.status(403).json({ message: "Enrollment belongs to another daycare" });
        }
      }
      const row = await storage.createPayment(parsed);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment record" });
    }
  });
  app2.put("/api/payments/:id", isAuthenticated2, requireMembership(), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = insertPaymentSchema.partial().parse(req.body);
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
          const totalOwed = all.filter((p) => p.status !== "paid").reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2);
          await storage.updateParentTier(details.parent.id, newTier, totalOwed);
        }
      }
      res.json(payment);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });
  app2.get("/api/alerts", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      const resolved = typeof req.query.resolved === "string" ? req.query.resolved === "true" : void 0;
      const rows = await storage.getAlerts(resolved, req.daycareId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching alerts:", e);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });
  app2.post("/api/alerts", isAuthenticated2, requireMembership(), async (req, res) => {
    try {
      const parsed = insertPaymentAlertSchema.parse({ ...req.body, daycareId: req.daycareId });
      const row = await storage.createAlert(parsed);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });
  app2.put("/api/alerts/:id/resolve", isAuthenticated2, async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
async function getPlugins() {
  const basePlugins = [react(), runtimeErrorOverlay()];
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    basePlugins.push(cartographer());
  }
  return basePlugins;
}
var vite_config_default = defineConfig(async () => {
  return {
    plugins: await getPlugins(),
    root: path.resolve(import.meta.dirname, "client"),
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets")
      }
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true
    }
    // ❌ REMOVE `server` and `preview` here — they're handled in vite.ts
  };
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use(/^(?!\/api).*/, async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_localAuth();
var app = express2();
var isProd2 = process.env.NODE_ENV === "production";
var FRONTEND_ORIGINS = isProd2 ? ["https://educonnect-8y46.onrender.com"] : ["http://localhost:5173", "http://localhost:5174"];
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || FRONTEND_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("CORS not allowed"));
    },
    credentials: true
  })
);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "daycare-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd2,
      // only over https in prod
      sameSite: isProd2 ? "none" : "lax",
      // required for cross-site cookies
      maxAge: 24 * 60 * 60 * 1e3
    }
  })
);
setupLocalAuth(app);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let bodySnapshot;
  const orig = res.json.bind(res);
  res.json = (b) => {
    bodySnapshot = b;
    return orig(b);
  };
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (path3.startsWith("/api")) {
      let line = `${req.method} ${path3} ${res.statusCode} in ${ms}ms`;
      if (bodySnapshot) line += ` :: ${JSON.stringify(bodySnapshot)}`;
      if (line.length > 80) line = line.slice(0, 79) + "\u2026";
      log(line);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    res.status(err.status || err.statusCode || 500).json({ message: err.message || "Internal Server Error" });
    throw err;
  });
  if (isProd2) serveStatic(app);
  else await setupVite(app, server);
  const port = Number(process.env.PORT) || 5e3;
  server.listen(port, "0.0.0.0", () => {
    console.log(` Server listening on http://0.0.0.0:${port}`);
  });
})();
