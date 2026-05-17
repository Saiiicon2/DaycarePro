var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
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
  auditLogs: () => auditLogs,
  auditLogsRelations: () => auditLogsRelations,
  children: () => children,
  childrenRelations: () => childrenRelations,
  daycares: () => daycares,
  daycaresRelations: () => daycaresRelations,
  ecosystems: () => ecosystems,
  ecosystemsRelations: () => ecosystemsRelations,
  enrollments: () => enrollments,
  enrollmentsRelations: () => enrollmentsRelations,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertChildSchema: () => insertChildSchema,
  insertDaycareSchema: () => insertDaycareSchema,
  insertEcosystemSchema: () => insertEcosystemSchema,
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
var insertMembershipSchema, membershipSchema, sessions, users, ecosystems, daycares, memberships, parents, children, enrollments, payments, paymentAlerts, auditLogs, usersRelations, ecosystemsRelations, daycaresRelations, membershipsRelations, parentsRelations, childrenRelations, enrollmentsRelations, paymentsRelations, paymentAlertsRelations, auditLogsRelations, upsertUserSchema, insertEcosystemSchema, insertDaycareSchema, insertParentSchema, insertChildSchema, insertEnrollmentSchema, insertPaymentSchema, insertPaymentAlertSchema, insertAuditLogSchema;
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
    ecosystems = sqliteTable("ecosystems", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      accountId: text("account_id").notNull().unique(),
      name: text("name").notNull(),
      description: text("description"),
      isActive: integer("is_active", { mode: "boolean" }).default(true),
      payfastMerchantId: text("payfast_merchant_id"),
      payfastMerchantKey: text("payfast_merchant_key"),
      payfastPassphrase: text("payfast_passphrase"),
      payfastMode: text("payfast_mode").default("sandbox"),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
      updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow()
    });
    daycares = sqliteTable("daycares", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      ecosystemId: integer("ecosystem_id"),
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
      isActive: integer("is_active", { mode: "boolean" }).default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow()
    });
    parents = sqliteTable("parents", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      ecosystemId: integer("ecosystem_id"),
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
      gatewayProvider: text("gateway_provider").default("local"),
      gatewayStatus: text("gateway_status").default("pending"),
      gatewayReference: text("gateway_reference"),
      checkoutUrl: text("checkout_url"),
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
    auditLogs = sqliteTable("audit_logs", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      action: text("action").notNull(),
      // e.g. 'blacklist', 'create_alert', 'create_invoice'
      actorId: text("actor_id"),
      // user id who performed the action
      targetType: text("target_type"),
      // e.g. 'parent', 'alert', 'payment'
      targetId: text("target_id"),
      // stringified id (nullable)
      daycareId: integer("daycare_id"),
      // optional org scope
      payload: blob("payload", { mode: "json" }),
      createdAt: integer("created_at", { mode: "timestamp" }).defaultNow()
    });
    usersRelations = relations(users, ({ one, many }) => ({
      daycare: one(daycares, { fields: [users.daycareId], references: [daycares.id] }),
      // legacy
      activeDaycare: one(daycares, { fields: [users.activeDaycareId], references: [daycares.id] }),
      memberships: many(memberships)
    }));
    ecosystemsRelations = relations(ecosystems, ({ many }) => ({
      daycares: many(daycares)
    }));
    daycaresRelations = relations(daycares, ({ many, one }) => ({
      ecosystem: one(ecosystems, { fields: [daycares.ecosystemId], references: [ecosystems.id] }),
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
      ecosystem: one(ecosystems, { fields: [parents.ecosystemId], references: [ecosystems.id] }),
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
    auditLogsRelations = relations(auditLogs, ({ one }) => ({
      daycare: one(daycares, { fields: [auditLogs.daycareId], references: [daycares.id] })
    }));
    upsertUserSchema = createInsertSchema(users);
    insertEcosystemSchema = createInsertSchema(ecosystems);
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
    insertAuditLogSchema = createInsertSchema(auditLogs);
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
    memberships: m,
    accessibleDaycares: m.map((mm) => ({ id: mm.daycareId, name: mm.daycareName, role: mm.role }))
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
    const ecosystemId = req.body.ecosystemId ? Number(req.body.ecosystemId) : void 0;
    const ecosystemName = norm(req.body.ecosystemName) || daycareName;
    const ecosystemAccountId = norm(req.body.ecosystemAccountId) || randomUUID();
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
      let resolvedEcosystemId = null;
      if (ecosystemId) {
        if (loggedIn && !isAdmin2(req.session.user)) {
          const [activeDaycare] = await db.select({ ecosystemId: daycares.ecosystemId }).from(daycares).where(eq3(daycares.id, req.session.user.activeDaycareId ?? 0));
          if (!activeDaycare || activeDaycare.ecosystemId !== ecosystemId) {
            return res.status(403).json({ message: "Cannot add a daycare to a different ecosystem" });
          }
        }
        resolvedEcosystemId = ecosystemId;
      }
      if (loggedIn && !resolvedEcosystemId && req.session.user.activeDaycareId) {
        const [activeDaycare] = await db.select({ ecosystemId: daycares.ecosystemId }).from(daycares).where(eq3(daycares.id, req.session.user.activeDaycareId));
        if (activeDaycare?.ecosystemId) resolvedEcosystemId = activeDaycare.ecosystemId;
      }
      const result = db.transaction((tx) => {
        let ecosystemRow = null;
        if (!loggedIn) {
          const ecoInsert = tx.insert(ecosystems).values({
            accountId: ecosystemAccountId,
            name: ecosystemName,
            description: `Ecosystem created for ${daycareName}`,
            isActive: true,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).run();
          resolvedEcosystemId = Number(ecoInsert.lastInsertRowid);
        }
        const dcInsert = tx.insert(daycares).values({
          ecosystemId: resolvedEcosystemId,
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
            activeDaycareId: daycareId,
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
        return { daycare: dc, createdUser, daycareId, ecosystemId: resolvedEcosystemId };
      });
      if (result.createdUser) {
        const sessionUser = await buildSessionUser(result.createdUser);
        req.session.user = sessionUser;
        return res.json({ user: sessionUser, daycare: result.daycare, ecosystemId: result.ecosystemId });
      }
      const [freshUser] = await db.select().from(users).where(eq3(users.id, req.session.user.id));
      const refreshed = await buildSessionUser(freshUser);
      req.session.user = refreshed;
      return res.json({ user: refreshed, daycare: result.daycare, ecosystemId: result.ecosystemId });
    } catch (e) {
      console.error("register-daycare error", e);
      if (e?.message === "Email already in use") return res.status(409).json({ message: e.message });
      if (e?.message === "Missing email or password for first owner") return res.status(400).json({ message: e.message });
      if (e?.message?.includes("UNIQUE constraint failed: ecosystems.account_id")) {
        return res.status(409).json({ message: "Ecosystem accountId already exists" });
      }
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
  async function handleSwitchDaycare(req, res) {
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
  }
  app2.post("/api/auth/switch-daycare", handleSwitchDaycare);
  app2.post("/api/auth/active-daycare", handleSwitchDaycare);
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
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      const sid = req.session?.id;
      req.session?.destroy?.(() => {
      });
      res.clearCookie("connect.sid");
      res.clearCookie("sid");
      res.status(204).end();
    } catch (e) {
      console.error("Logout error:", e);
      res.status(500).json({ message: "Logout failed" });
    }
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
import { createHash } from "crypto";

// server/storage.ts
init_schema();
init_db();
import { eq, desc, and, sql, or } from "drizzle-orm";
var DatabaseStorage = class {
  // Daycares the user can access (via memberships). Admins won’t use this.
  async getUserDaycares(userId) {
    const rows = await db.select({
      id: daycares.id,
      name: daycares.name,
      address: daycares.address,
      phone: daycares.phone,
      isActive: daycares.isActive
    }).from(memberships).leftJoin(daycares, eq(memberships.daycareId, daycares.id)).where(and(
      eq(memberships.userId, userId),
      eq(memberships.isActive, true),
      eq(daycares.isActive, true)
    )).orderBy(daycares.name);
    return rows;
  }
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
  async updateMembership(userId, daycareId, updates) {
    const setObj = {};
    if (updates.role !== void 0) setObj.role = updates.role;
    if (updates.isActive !== void 0) setObj.isActive = updates.isActive;
    const [row] = await db.update(memberships).set(setObj).where(and(eq(memberships.userId, userId), eq(memberships.daycareId, daycareId))).returning();
    return row;
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
      activeDaycareId: users.activeDaycareId,
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
  async getEcosystems() {
    return await db.select().from(ecosystems).where(eq(ecosystems.isActive, true)).orderBy(ecosystems.name);
  }
  async getEcosystem(id) {
    const [ecosystem] = await db.select().from(ecosystems).where(eq(ecosystems.id, id));
    return ecosystem;
  }
  async getEcosystemByAccountId(accountId) {
    const [ecosystem] = await db.select().from(ecosystems).where(eq(ecosystems.accountId, accountId));
    return ecosystem;
  }
  async createEcosystem(ecosystem) {
    const [newEcosystem] = await db.insert(ecosystems).values(ecosystem).returning();
    return newEcosystem;
  }
  async updateEcosystem(id, ecosystem) {
    const [updatedEcosystem] = await db.update(ecosystems).set({ ...ecosystem, updatedAt: /* @__PURE__ */ new Date() }).where(eq(ecosystems.id, id)).returning();
    return updatedEcosystem;
  }
  async getDaycaresByEcosystem(ecosystemId) {
    return await db.select().from(daycares).where(and(eq(daycares.ecosystemId, ecosystemId), eq(daycares.isActive, true))).orderBy(daycares.name);
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
  async getParents(search, daycareId, ecosystemId) {
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
    if (ecosystemId) conds.push(eq(parents.ecosystemId, ecosystemId));
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
  async getParentByEmailInEcosystem(email, ecosystemId) {
    const [parent] = await db.select().from(parents).where(and(eq(parents.email, email), eq(parents.ecosystemId, ecosystemId))).limit(1);
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
  // Counts and cascade helpers for safe deletes
  async countPaymentsByParent(parentId) {
    const [r] = await db.select({ count: sql`count(*)` }).from(payments).where(eq(payments.parentId, parentId));
    return r.count || 0;
  }
  async countEnrollmentsByChild(childId) {
    const [r] = await db.select({ count: sql`count(*)` }).from(enrollments).where(eq(enrollments.childId, childId));
    return r.count || 0;
  }
  // Delete payments for a parent
  async deletePaymentsByParent(parentId) {
    await db.delete(payments).where(eq(payments.parentId, parentId));
  }
  // Delete payments for a set of enrollment IDs
  async deletePaymentsByEnrollmentIds(enrollmentIds) {
    if (!enrollmentIds || enrollmentIds.length === 0) return;
    await db.delete(payments).where(sql`enrollment_id IN (${sql.join(enrollmentIds.map((id) => sql`${id}`), sql`,`)})`);
  }
  // Delete enrollments for a child
  async deleteEnrollmentsByChild(childId) {
    await db.delete(enrollments).where(eq(enrollments.childId, childId));
  }
  // Delete children for a parent
  async deleteChildrenByParent(parentId) {
    await db.delete(children).where(eq(children.parentId, parentId));
  }
  // Cascade delete: child -> enrollments -> payments -> child
  async deleteChildCascade(childId) {
    const enrs = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.childId, childId));
    const ids = enrs.map((e) => e.id).filter(Boolean);
    if (ids.length) {
      await this.deletePaymentsByEnrollmentIds(ids);
      await db.delete(enrollments).where(sql`id IN (${sql.join(ids.map((id) => sql`${id}`), sql`,`)})`);
    }
    await db.delete(children).where(eq(children.id, childId));
  }
  // Cascade delete for parent: payments (by parent), for each child delete enrollments/payments then children, then parent
  async deleteParentCascade(parentId) {
    await this.deletePaymentsByParent(parentId);
    const childRows = await db.select({ id: children.id }).from(children).where(eq(children.parentId, parentId));
    const childIds = childRows.map((c) => c.id).filter(Boolean);
    for (const cid of childIds) {
      await this.deleteChildCascade(cid);
    }
    await db.delete(parents).where(eq(parents.id, parentId));
  }
  // List enrollments (optionally scoped to a daycare)
  async getEnrollments(daycareId) {
    const conds = [];
    if (daycareId) conds.push(eq(enrollments.daycareId, daycareId));
    const base = db.select({ enrollment: enrollments, child: children, daycare: daycares }).from(enrollments).leftJoin(children, eq(enrollments.childId, children.id)).leftJoin(daycares, eq(enrollments.daycareId, daycares.id));
    const q = conds.length ? base.where(and(...conds)) : base;
    const rows = await q.orderBy(desc(enrollments.createdAt));
    const results = [];
    for (const r of rows) {
      const pay = await db.select().from(payments).where(eq(payments.enrollmentId, r.enrollment.id));
      results.push({ ...r.enrollment, child: r.child, daycare: r.daycare, payments: pay });
    }
    return results;
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
    const sanitized = { ...child };
    if (sanitized.createdAt !== void 0) sanitized.createdAt = new Date(Number(sanitized.createdAt));
    if (sanitized.dateOfBirth !== void 0) sanitized.dateOfBirth = new Date(String(sanitized.dateOfBirth));
    sanitized.updatedAt = /* @__PURE__ */ new Date();
    const [updatedChild] = await db.update(children).set(sanitized).where(eq(children.id, id)).returning();
    return updatedChild;
  }
  // Delete operations (admin-only endpoints will use these)
  async deleteParent(id) {
    await db.delete(parents).where(eq(parents.id, id));
  }
  async deleteDaycare(id) {
    await db.delete(daycares).where(eq(daycares.id, id));
  }
  async deleteChild(id) {
    await db.delete(children).where(eq(children.id, id));
  }
  // Enrollment operations
  async getEnrollment(id) {
    const [r] = await db.select({
      enrollment: enrollments,
      child: children,
      daycare: daycares
    }).from(enrollments).leftJoin(children, eq(enrollments.childId, children.id)).leftJoin(daycares, eq(enrollments.daycareId, daycares.id)).where(eq(enrollments.id, id));
    if (!r) return void 0;
    const pay = await db.select().from(payments).where(eq(payments.enrollmentId, id));
    return {
      ...r.enrollment,
      child: r.child,
      daycare: r.daycare,
      payments: pay
    };
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
  // Audit log operations
  async addAudit(entry) {
    const toInsert = {
      action: entry.action,
      actorId: entry.actorId ?? null,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId != null ? String(entry.targetId) : null,
      daycareId: entry.daycareId ?? null,
      payload: entry.payload ?? {},
      createdAt: /* @__PURE__ */ new Date()
    };
    const [row] = await db.insert(auditLogs).values(toInsert).returning();
    return row;
  }
  async getAudits(filter) {
    const conds = [];
    if (filter?.daycareId) conds.push(eq(auditLogs.daycareId, filter.daycareId));
    if (filter?.actorId) conds.push(eq(auditLogs.actorId, filter.actorId));
    if (filter?.action) conds.push(eq(auditLogs.action, filter.action));
    const q = conds.length ? db.select().from(auditLogs).where(and(...conds)) : db.select().from(auditLogs);
    const rows = await q.orderBy(desc(auditLogs.createdAt)).limit(filter?.limit ?? 100);
    return rows;
  }
  async resolveAlert(id, resolvedBy) {
    const [resolvedAlert] = await db.update(paymentAlerts).set({
      isResolved: true,
      resolvedBy,
      resolvedAt: /* @__PURE__ */ new Date()
    }).where(eq(paymentAlerts.id, id)).returning();
    return resolvedAlert;
  }
  // ===== ECOSYSTEM SAFETY CHECKS =====
  /**
   * Check if a child has simultaneous active enrollments across multiple daycares in the same ecosystem
   */
  async checkSimultaneousEnrollments(childId) {
    const rows = await db.select({
      daycareId: enrollments.daycareId,
      daycareName: daycares.name,
      startDate: enrollments.startDate,
      endDate: enrollments.endDate,
      status: enrollments.status
    }).from(enrollments).leftJoin(daycares, eq(enrollments.daycareId, daycares.id)).where(and(
      eq(enrollments.childId, childId),
      eq(enrollments.status, "active")
    ));
    return {
      hasMultipleEnrollments: rows.length > 1,
      enrollments: rows.map((r) => ({
        daycareId: r.daycareId,
        daycareName: r.daycareName || "Unknown",
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status
      }))
    };
  }
  /**
   * Check if a parent recently transferred a child after due/overdue payments
   * Returns suspicious transfers within the last N days
   */
  async checkRecentTransfersAfterDuePayments(parentId, ecosystemId, days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
    const childRows = await db.select({ id: children.id, firstName: children.firstName, lastName: children.lastName }).from(children).where(eq(children.parentId, parentId));
    const transfers = [];
    for (const child of childRows) {
      const enrs = await db.select({
        enrollmentId: enrollments.id,
        daycareId: enrollments.daycareId,
        daycareName: daycares.name,
        startDate: enrollments.startDate,
        endDate: enrollments.endDate,
        status: enrollments.status
      }).from(enrollments).leftJoin(daycares, eq(enrollments.daycareId, daycares.id)).where(eq(enrollments.childId, child.id)).orderBy(enrollments.startDate);
      for (let i = 0; i < enrs.length - 1; i++) {
        const current = enrs[i];
        const next = enrs[i + 1];
        if (current.endDate && next.startDate) {
          const transferDate = new Date(next.startDate);
          if (transferDate >= cutoffDate) {
            const [duePayments] = await db.select({ count: sql`count(*)` }).from(payments).where(and(
              eq(payments.parentId, parentId),
              eq(payments.status, "overdue")
            ));
            const [recentDuePayment] = await db.select({ dueDate: payments.dueDate }).from(payments).where(and(
              eq(payments.parentId, parentId),
              sql`${payments.dueDate} < strftime('%s', 'now')`
            )).orderBy(desc(payments.dueDate)).limit(1);
            transfers.push({
              childId: child.id,
              childName: `${child.firstName} ${child.lastName}`,
              fromDaycare: current.daycareName || "Unknown",
              toDaycare: next.daycareName || "Unknown",
              transferDate,
              outstandingPayments: duePayments.count || 0,
              lastDueDate: recentDuePayment?.dueDate ? new Date(Number(recentDuePayment.dueDate)) : null
            });
          }
        }
      }
    }
    return {
      hasSuspiciousTransfer: transfers.length > 0,
      detail: transfers
    };
  }
  /**
   * Get parent's complete profile across entire ecosystem
   */
  async getParentEcosystemProfile(parentId, ecosystemId) {
    const parent = await this.getParent(parentId);
    if (!parent) throw new Error("Parent not found");
    const daycareList = await db.select({ id: daycares.id, name: daycares.name }).from(daycares).where(eq(daycares.ecosystemId, ecosystemId));
    const childList = await db.select({ id: children.id }).from(children).where(eq(children.parentId, parentId));
    const enrollmentHistory = [];
    for (const child of childList) {
      const enrs = await db.select({
        daycareName: daycares.name,
        startDate: enrollments.startDate,
        endDate: enrollments.endDate,
        status: enrollments.status
      }).from(enrollments).leftJoin(daycares, eq(enrollments.daycareId, daycares.id)).where(and(
        eq(enrollments.childId, child.id),
        sql`${daycares.ecosystemId} = ${ecosystemId}`
      ));
      enrollmentHistory.push(...enrs.map((e) => ({
        daycareName: e.daycareName || "Unknown",
        startDate: e.startDate,
        endDate: e.endDate,
        status: e.status
      })));
    }
    const [issueCount] = await db.select({ count: sql`count(*)` }).from(payments).where(and(
      eq(payments.parentId, parentId),
      sql`${payments.status} IN ('overdue', 'missed')`
    ));
    return {
      parent,
      allDaycares: daycareList.map((d) => ({ daycareId: d.id, daycareName: d.name })),
      enrollmentHistory: enrollmentHistory.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
      totalOwedAcrossEcosystem: parent.totalOwed || 0,
      paymentIssuesCount: issueCount.count || 0,
      isBlacklistedAcrossEcosystem: parent.isBlacklisted || false
    };
  }
  /**
   * Get ecosystem-wide alerts with filtering
   */
  async getEcosystemAlerts(ecosystemId, options) {
    const conds = [];
    const daycareIds = await db.select({ id: daycares.id }).from(daycares).where(eq(daycares.ecosystemId, ecosystemId));
    if (daycareIds.length === 0) return [];
    conds.push(sql`${paymentAlerts.daycareId} IN (${sql.join(daycareIds.map((d) => d.id), sql`,`)})`);
    if (options?.unresolved === true) {
      conds.push(eq(paymentAlerts.isResolved, false));
    }
    if (options?.alertType) {
      conds.push(eq(paymentAlerts.alertType, options.alertType));
    }
    const rows = await db.select({
      id: paymentAlerts.id,
      parentId: paymentAlerts.parentId,
      parentFirstName: parents.firstName,
      parentLastName: parents.lastName,
      daycareId: paymentAlerts.daycareId,
      daycareName: daycares.name,
      alertType: paymentAlerts.alertType,
      message: paymentAlerts.message,
      severity: paymentAlerts.severity,
      isResolved: paymentAlerts.isResolved,
      createdAt: paymentAlerts.createdAt
    }).from(paymentAlerts).leftJoin(parents, eq(paymentAlerts.parentId, parents.id)).leftJoin(daycares, eq(paymentAlerts.daycareId, daycares.id)).where(conds.length > 0 ? and(...conds) : void 0).orderBy(desc(paymentAlerts.createdAt)).limit(options?.limit ?? 100);
    return rows.map((r) => ({
      id: r.id,
      parentId: r.parentId,
      parentName: `${r.parentFirstName} ${r.parentLastName}`,
      daycareId: r.daycareId,
      daycareName: r.daycareName || "Unknown",
      alertType: r.alertType,
      message: r.message,
      severity: r.severity,
      isResolved: r.isResolved,
      createdAt: r.createdAt
    }));
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
  app2.post("/api/auth/active-daycare", isAuthenticated2, async (req, res) => {
    const { daycareId } = req.body ?? {};
    if (!daycareId) return res.status(400).json({ message: "daycareId required" });
    const ok = await storage.userCanAccessDaycare(req.user.id, Number(daycareId));
    if (!ok) return res.status(403).json({ message: "You don\u2019t have access to that daycare" });
    if (req.session) {
      req.session.user = { ...req.session.user || {}, activeDaycareId: Number(daycareId) };
    }
    req.user.activeDaycareId = Number(daycareId);
    res.status(204).end();
  });
  app2.get("/api/ecosystems", isAuthenticated2, adminOnly, async (_req, res) => {
    try {
      const rows = await storage.getEcosystems();
      res.json(rows);
    } catch (error) {
      console.error("Error fetching ecosystems:", error);
      res.status(500).json({ message: "Failed to fetch ecosystems" });
    }
  });
  app2.post("/api/ecosystems", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const data = z2.object({
        accountId: z2.string().min(1),
        name: z2.string().min(1),
        description: z2.string().optional(),
        payfastMerchantId: z2.string().optional(),
        payfastMerchantKey: z2.string().optional(),
        payfastPassphrase: z2.string().optional(),
        payfastMode: z2.enum(["sandbox", "live"]).default("sandbox")
      }).parse(req.body);
      const row = await storage.createEcosystem(data);
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid ecosystem data", errors: error.errors });
      }
      console.error("Error creating ecosystem:", error);
      res.status(500).json({ message: "Failed to create ecosystem" });
    }
  });
  app2.get("/api/ecosystems/:id/daycares", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const ecosystemId = Number(req.params.id);
      const rows = await storage.getDaycaresByEcosystem(ecosystemId);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching daycares for ecosystem:", error);
      res.status(500).json({ message: "Failed to fetch ecosystem daycares" });
    }
  });
  app2.get("/api/daycares", isAuthenticated2, async (req, res) => {
    try {
      const u = req.user;
      const ecosystemId = req.query.ecosystemId ? Number(req.query.ecosystemId) : void 0;
      const list = isAdmin3(u) ? ecosystemId ? await storage.getDaycaresByEcosystem(ecosystemId) : await storage.getDaycares() : await storage.getUserDaycares(u.id);
      res.json(list);
    } catch (err) {
      console.error("Error fetching daycares:", err);
      res.status(500).json({ message: "Failed to fetch daycare centers" });
    }
  });
  app2.use("/api", isAuthenticated2, async (req, _res, next) => {
    try {
      const u = req.user;
      if (!isAdmin3(u) && !u.activeDaycareId) {
        const ms = await storage.getMemberships(u.id);
        if (ms?.length) {
          const firstDcId = ms[0].daycareId;
          if (req.session) {
            req.session.user = { ...req.session.user || {}, activeDaycareId: firstDcId };
          }
          req.user.activeDaycareId = firstDcId;
        }
      }
    } catch (e) {
      console.warn("Could not set activeDaycareId:", e);
    }
    next();
  });
  app2.use(async (req, _res, next) => {
    try {
      if (req.user?.id) {
        const fresh = await storage.getUser(req.user.id);
        if (fresh) req.user = fresh;
      }
    } catch {
    }
    next();
  });
  app2.get("/api/auth/user", isAuthenticated2, async (req, res) => {
    res.json(req.user);
  });
  app2.get("/api/users", isAuthenticated2, adminOnly, async (_req, res) => {
    try {
      const rows = await storage.getUsers();
      res.json(rows);
    } catch (e) {
      console.error("Error fetching users:", e);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const data = upsertUserSchema.partial().extend({
        password: z2.string().optional()
      }).parse(req.body);
      const bcrypt2 = await import("bcryptjs");
      if (data.password) {
        const hashed = await bcrypt2.hash(data.password, 10);
        data.password = hashed;
      }
      if (!data.id) {
        try {
          data.id = globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2);
        } catch {
          data.id = String(Date.now()) + Math.random().toString(36).slice(2);
        }
      }
      const created = await storage.createUser(data);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.put("/api/users/:id", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const id = String(req.params.id);
      const data = upsertUserSchema.partial().extend({ password: z2.string().optional() }).parse(req.body);
      if (data.password) {
        const bcrypt2 = await import("bcryptjs");
        data.password = await bcrypt2.hash(data.password, 10);
      }
      const toUpsert = { ...data, id };
      const updated = await storage.upsertUser(toUpsert);
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.get("/api/users/:id/memberships", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const userId = String(req.params.id);
      const rows = await storage.getMemberships(userId);
      res.json(rows);
    } catch (e) {
      console.error("Error fetching memberships:", e);
      res.status(500).json({ message: "Failed to fetch memberships" });
    }
  });
  app2.post("/api/users/:id/memberships", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const userId = String(req.params.id);
      const Body = z2.object({ daycareId: z2.number().int().positive(), role: z2.enum(["daycare", "manager", "admin"]).optional() });
      const { daycareId, role } = Body.parse(req.body);
      const row = await storage.addMembership(userId, daycareId, role);
      res.status(201).json(row);
    } catch (e) {
      if (e instanceof z2.ZodError) return res.status(400).json({ message: "Invalid membership data", errors: e.errors });
      console.error("Error adding membership:", e);
      res.status(500).json({ message: "Failed to add membership" });
    }
  });
  app2.delete("/api/users/:id/memberships/:daycareId", isAuthenticated2, adminOnly, async (req, res) => {
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
  app2.put("/api/users/:id/memberships", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const userId = String(req.params.id);
      const Body = z2.object({ daycareId: z2.number().int().positive(), role: z2.string().optional(), isActive: z2.boolean().optional() });
      const { daycareId, role, isActive } = Body.parse(req.body);
      const row = await storage.updateMembership(userId, daycareId, { role, isActive });
      res.json(row);
    } catch (e) {
      if (e instanceof z2.ZodError) return res.status(400).json({ message: "Invalid membership update", errors: e.errors });
      console.error("Error updating membership:", e);
      res.status(500).json({ message: "Failed to update membership" });
    }
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
  app2.post(
    "/api/daycares",
    isAuthenticated2,
    adminOnly,
    async (req, res) => {
      try {
        const BodySchema = insertDaycareSchema.extend({
          ownerEmail: z2.string().email().optional(),
          ecosystemId: z2.number().int().positive().optional()
        });
        const { ownerEmail, ...daycarePayload } = BodySchema.parse(req.body);
        const daycare = await storage.createDaycare(daycarePayload);
        let ownerLinked = false;
        let ownerUserId = null;
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
          message: ownerEmail && !ownerLinked ? "Daycare created. No user with that email; assign later." : "Daycare created."
        });
      } catch (error) {
        if (error instanceof z2.ZodError) {
          return res.status(400).json({ message: "Invalid daycare data", errors: error.errors });
        }
        console.error("Error creating daycare:", error);
        res.status(500).json({ message: "Failed to create daycare center" });
      }
    }
  );
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
        const resolvedDaycare = await storage.getDaycare(resolvedDaycareId);
        if (!resolvedDaycare) {
          return res.status(404).json({ message: "Resolved daycare not found" });
        }
        const existing = await storage.getParentByEmail(email);
        const existingInEcosystem = resolvedDaycare.ecosystemId ? await storage.getParentByEmailInEcosystem(email, resolvedDaycare.ecosystemId) : void 0;
        if (existingInEcosystem) {
          return res.status(409).json({
            message: "Parent already exists in this ecosystem",
            existingParentId: existingInEcosystem.id,
            existingDaycareId: existingInEcosystem.daycareId,
            ecosystemId: existingInEcosystem.ecosystemId
          });
        }
        if (existing && existing.ecosystemId && resolvedDaycare.ecosystemId && existing.ecosystemId !== resolvedDaycare.ecosystemId) {
          return res.status(409).json({
            message: "Parent exists in a different ecosystem",
            existingParentId: existing.id,
            existingEcosystemId: existing.ecosystemId,
            targetEcosystemId: resolvedDaycare.ecosystemId
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
          daycareId: resolvedDaycareId,
          ecosystemId: resolvedDaycare.ecosystemId ?? null
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
  app2.post("/api/parents/:id/blacklist", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const id = Number(req.params.id);
      console.log("[routes] POST /api/parents/:id/blacklist called by", req.user?.id, "body=", req.body);
      const { isBlacklisted } = req.body ?? {};
      if (typeof isBlacklisted !== "boolean") return res.status(400).json({ message: "isBlacklisted boolean required" });
      const row = await storage.updateParent(id, { isBlacklisted });
      try {
        await storage.addAudit({
          action: "blacklist_toggle",
          actorId: req.user?.id ?? null,
          targetType: "parent",
          targetId: String(id),
          daycareId: req.daycareId ?? null,
          payload: { isBlacklisted }
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
  app2.get("/api/parents/:id/ecosystem-profile", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
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
  app2.get("/api/ecosystems/:id/alerts", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const ecosystemId = Number(req.params.id);
      const unresolved = req.query.unresolved === "true" ? true : void 0;
      const alertType = req.query.alertType ? String(req.query.alertType) : void 0;
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const alerts = await storage.getEcosystemAlerts(ecosystemId, {
        unresolved,
        alertType,
        limit
      });
      res.json(alerts);
    } catch (e) {
      console.error("Error fetching ecosystem alerts:", e);
      res.status(500).json({ message: "Failed to fetch ecosystem alerts" });
    }
  });
  app2.get("/api/ecosystems/:id/suspicious-activity", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const ecosystemId = Number(req.params.id);
      const alerts = await storage.getEcosystemAlerts(ecosystemId, {
        unresolved: true,
        limit: 1e3
      });
      const suspicious = {
        totalUnresolvedAlerts: alerts.length,
        simultaneousEnrollments: alerts.filter((a) => a.alertType === "simultaneous_enrollment").length,
        suspiciousTransfers: alerts.filter((a) => a.alertType === "suspicious_transfer").length,
        enrollmentAttempts: alerts.filter((a) => a.alertType === "enrollment_attempt").length,
        highSeverityCount: alerts.filter((a) => a.severity === "high").length,
        mediumSeverityCount: alerts.filter((a) => a.severity === "medium").length,
        recentAlerts: alerts.slice(0, 20)
      };
      res.json(suspicious);
    } catch (e) {
      console.error("Error fetching suspicious activity summary:", e);
      res.status(500).json({ message: "Failed to fetch suspicious activity summary" });
    }
  });
  app2.put("/api/ecosystems/:id/enforcement", isAuthenticated2, adminOnly, async (req, res) => {
    try {
      const ecosystemId = Number(req.params.id);
      const { enforceAlerts } = req.body;
      if (typeof enforceAlerts !== "boolean") {
        return res.status(400).json({ message: "enforceAlerts must be a boolean" });
      }
      const ecosystem = await storage.getEcosystem(ecosystemId);
      if (!ecosystem) return res.status(404).json({ message: "Ecosystem not found" });
      const updated = await storage.updateEcosystem(ecosystemId, { enforceAlerts });
      try {
        await storage.addAudit({
          action: "enforcement_toggle",
          actorId: req.user?.id ?? null,
          targetType: "ecosystem",
          targetId: String(ecosystemId),
          payload: { enforceAlerts, previousEnforceAlerts: ecosystem.enforceAlerts }
        });
      } catch (auditErr) {
        console.warn("Failed to write audit log for enforcement toggle:", auditErr);
      }
      res.json({
        id: updated.id,
        name: updated.name,
        enforceAlerts: updated.enforceAlerts,
        mode: updated.enforceAlerts ? "ENFORCE (blocking)" : "MONITOR (alerts only)",
        message: `Ecosystem switched to ${updated.enforceAlerts ? "ENFORCE" : "MONITOR"} mode`
      });
    } catch (e) {
      console.error("Error toggling enforcement mode:", e);
      res.status(500).json({ message: "Failed to toggle enforcement mode" });
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
      const daycare = await storage.getDaycare(parsed.daycareId);
      if (daycare?.ecosystemId) {
        const ecosystem = await storage.getEcosystem(daycare.ecosystemId);
        const allAlerts = [];
        const simultaneousCheck = await storage.checkSimultaneousEnrollments(parsed.childId);
        if (simultaneousCheck.hasMultipleEnrollments && simultaneousCheck.enrollments.length > 0) {
          const otherDaycare = simultaneousCheck.enrollments.find((e) => e.daycareId !== parsed.daycareId);
          if (otherDaycare) {
            allAlerts.push({
              parentId: parent.id,
              daycareId: parsed.daycareId,
              alertType: "simultaneous_enrollment",
              message: `Alert: ${child.firstName} ${child.lastName} is simultaneously enrolled at ${otherDaycare.daycareName} in the same ecosystem`,
              severity: "high"
            });
          }
        }
        const transferCheck = await storage.checkRecentTransfersAfterDuePayments(parent.id, daycare.ecosystemId, 30);
        if (transferCheck.hasSuspiciousTransfer && transferCheck.detail.length > 0) {
          const transfer = transferCheck.detail[0];
          if (transfer.outstandingPayments > 0) {
            allAlerts.push({
              parentId: parent.id,
              daycareId: parsed.daycareId,
              alertType: "suspicious_transfer",
              message: `Alert: Parent has ${transfer.outstandingPayments} outstanding payment(s) and recently moved ${transfer.childName} from ${transfer.fromDaycare} to another center`,
              severity: "high"
            });
          }
        }
        for (const alert of allAlerts) {
          await storage.createAlert(alert);
        }
        if (ecosystem?.enforceAlerts && allAlerts.length > 0) {
          return res.status(403).json({
            message: "Enrollment blocked: Suspicious activity detected. Ecosystem is in Enforce mode.",
            alerts: allAlerts,
            enforceMode: true,
            recommendation: "Contact ecosystem admin to resolve or switch to Monitor mode"
          });
        }
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
  app2.post("/api/payments", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      console.log("[routes] POST /api/payments called by", req.user?.id, "body=", req.body);
      const incoming = { ...req.body || {} };
      if (incoming.paidDate) {
        if (typeof incoming.paidDate === "string") {
          const parsed2 = Date.parse(incoming.paidDate);
          incoming.paidDate = Number.isNaN(parsed2) ? void 0 : new Date(parsed2);
        }
        if (typeof incoming.paidDate === "number") incoming.paidDate = new Date(Number(incoming.paidDate));
      }
      if (incoming.dueDate) {
        if (typeof incoming.dueDate === "string") {
          const parsed2 = Date.parse(incoming.dueDate);
          incoming.dueDate = Number.isNaN(parsed2) ? void 0 : new Date(parsed2);
        }
        if (typeof incoming.dueDate === "number") incoming.dueDate = new Date(Number(incoming.dueDate));
      }
      if (incoming.amount && typeof incoming.amount === "string") {
        const n = Number(incoming.amount);
        incoming.amount = Number.isFinite(n) ? n : incoming.amount;
      }
      console.log("[routes] Normalized POST /api/payments payload:", incoming);
      const parsed = insertPaymentSchema.parse(incoming);
      if (parsed.enrollmentId) {
        const enroll = await storage.getEnrollment(parsed.enrollmentId);
        if (!enroll || enroll.daycareId !== req.daycareId) {
          return res.status(403).json({ message: "Enrollment belongs to another daycare" });
        }
      }
      const row = await storage.createPayment(parsed);
      try {
        await storage.addAudit({
          action: "create_invoice",
          actorId: req.user?.id ?? null,
          targetType: "payment",
          targetId: String(row.id),
          daycareId: req.daycareId ?? null,
          payload: { parentId: parsed.parentId, enrollmentId: parsed.enrollmentId, amount: parsed.amount, dueDate: parsed.dueDate }
        });
      } catch (auditErr) {
        console.warn("Failed to write audit log for invoice:", auditErr);
      }
      res.status(201).json(row);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment record" });
    }
  });
  app2.post("/api/payments/:id/payfast-link", isAuthenticated2, ensureDaycareFromPayment, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
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
      const params = {
        merchant_id: ecosystem.payfastMerchantId,
        merchant_key: ecosystem.payfastMerchantKey,
        return_url: process.env.PAYFAST_RETURN_URL || "https://example.com/return",
        cancel_url: process.env.PAYFAST_CANCEL_URL || "https://example.com/cancel",
        notify_url: process.env.PAYFAST_NOTIFY_URL || "https://example.com/api/payfast/ipn",
        m_payment_id: String(payment.id),
        amount: Number(payment.amount).toFixed(2),
        item_name: `Daycare invoice #${payment.id}`,
        email_address: payment.parent?.email ?? ""
      };
      const queryString = Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join("&");
      const signature = createHash("md5").update(`${queryString}&passphrase=${ecosystem.payfastPassphrase}`).digest("hex");
      const checkoutUrl = `https://sandbox.payfast.co.za/eng/process?${queryString}&signature=${signature}`;
      const updatedPayment = await storage.updatePayment(payment.id, {
        gatewayProvider: "payfast",
        gatewayStatus: "pending",
        checkoutUrl
      });
      res.json({ checkoutUrl, payment: updatedPayment });
    } catch (error) {
      console.error("Error creating PayFast checkout link:", error);
      res.status(500).json({ message: "Failed to create PayFast checkout link" });
    }
  });
  app2.post("/api/payfast/ipn", async (req, res) => {
    try {
      const body = req.body || {};
      const signature = String(body.signature || "").trim();
      const paymentId = Number(body.m_payment_id);
      if (!signature || !paymentId) {
        return res.status(400).send("Invalid PayFast IPN payload");
      }
      const params = { ...body };
      delete params.signature;
      const queryString = Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key] ?? ""))}`).join("&");
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
      const expectedSignature = createHash("md5").update(`${queryString}&passphrase=${ecosystem.payfastPassphrase ?? ""}`).digest("hex");
      if (expectedSignature !== signature) {
        console.warn("PayFast IPN invalid signature", { paymentId, expectedSignature, signature });
        return res.status(400).send("Invalid signature");
      }
      const paymentStatus = String(body.payment_status || "").toLowerCase();
      const gatewayStatus = paymentStatus === "complete" ? "complete" : paymentStatus === "failed" ? "failed" : "pending";
      const updatedFields = {
        gatewayStatus,
        gatewayReference: body.pf_payment_id ? String(body.pf_payment_id) : null
      };
      if (gatewayStatus === "complete") {
        updatedFields.status = "paid";
        updatedFields.paidDate = (/* @__PURE__ */ new Date()).toISOString();
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
            gatewayStatus
          }
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
  async function ensureDaycareFromPayment(req, res, next) {
    try {
      const rawDaycare = req.params && req.params.daycareId || req.query && req.query.daycareId || req.body && req.body.daycareId || req.daycareId;
      if (rawDaycare && !Number.isNaN(Number(rawDaycare))) {
        req.daycareId = Number(rawDaycare);
        return next();
      }
      const id = Number(req.params.id);
      if (!id || Number.isNaN(id)) return next();
      const details = await storage.getPayment(id);
      if (details && details.enrollment && details.enrollment.daycare && details.enrollment.daycare.id) {
        req.daycareId = Number(details.enrollment.daycare.id);
        req.body = req.body || {};
        req.body.daycareId = Number(details.enrollment.daycare.id);
      }
    } catch (e) {
      console.warn("Could not infer daycareId from payment:", e);
    }
    return next();
  }
  function logMembershipCheck(req, _res, next) {
    try {
      console.log("[routes] membership-check: user=", { id: req.user?.id, role: req.user?.role, activeDaycareId: req.user?.activeDaycareId });
      console.log("[routes] membership-check: resolved daycareId (params/query/body/derived)=", {
        params: req.params?.daycareId,
        query: req.query?.daycareId,
        body: req.body?.daycareId,
        derived: req.daycareId
      });
    } catch (e) {
      console.warn("Error logging membership check info", e);
    }
    next();
  }
  app2.put("/api/payments/:id", isAuthenticated2, ensureDaycareFromPayment, logMembershipCheck, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      const id = Number(req.params.id);
      console.log("[routes] PUT /api/payments/:id called by", req.user?.id, "id=", id, "body=", req.body);
      const incoming = { ...req.body || {} };
      if (incoming.paidDate) {
        if (typeof incoming.paidDate === "string") {
          const parsed = Date.parse(incoming.paidDate);
          incoming.paidDate = Number.isNaN(parsed) ? void 0 : new Date(parsed);
        }
        if (typeof incoming.paidDate === "number") incoming.paidDate = new Date(Number(incoming.paidDate));
      }
      if (incoming.dueDate) {
        if (typeof incoming.dueDate === "string") {
          const parsed = Date.parse(incoming.dueDate);
          incoming.dueDate = Number.isNaN(parsed) ? void 0 : new Date(parsed);
        }
        if (typeof incoming.dueDate === "number") incoming.dueDate = new Date(Number(incoming.dueDate));
      }
      if (incoming.amount && typeof incoming.amount === "string") {
        const n = Number(incoming.amount);
        incoming.amount = Number.isFinite(n) ? n : incoming.amount;
      }
      console.log("[routes] Normalized payment payload:", incoming);
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
          const totalOwed = all.filter((p) => p.status !== "paid").reduce((sum, p) => sum + Number(p.amount), 0);
          await storage.updateParentTier(details.parent.id, newTier, totalOwed);
        }
      }
      res.json(payment);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("Validation error updating payment:", error.errors);
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
  app2.post("/api/alerts", isAuthenticated2, requireMembership("daycareId", { adminBypass: true }), async (req, res) => {
    try {
      console.log("[routes] POST /api/alerts called by", req.user?.id, "body=", req.body);
      const parsed = insertPaymentAlertSchema.parse({ ...req.body, daycareId: req.daycareId });
      const row = await storage.createAlert(parsed);
      try {
        await storage.addAudit({
          action: "create_alert",
          actorId: req.user?.id ?? null,
          targetType: "alert",
          targetId: String(row.id),
          daycareId: req.daycareId ?? null,
          payload: { parentId: parsed.parentId, alertType: parsed.alertType, message: parsed.message, severity: parsed.severity }
        });
      } catch (auditErr) {
        console.warn("Failed to write audit log for alert:", auditErr);
      }
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
var MemoryStore = null;
try {
  const mem = __require("memorystore");
  MemoryStore = mem(session);
} catch (e) {
  console.warn("memorystore not available, falling back to default express-session MemoryStore");
}
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
    store: MemoryStore ? new MemoryStore({ checkPeriod: 864e5 }) : void 0,
    cookie: {
      httpOnly: true,
      secure: isProd2,
      // only over https in prod
      // When deploying with a separate frontend origin (e.g. Render), set sameSite to 'none'
      sameSite: isProd2 ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1e3,
      // allow overriding cookie domain via env when using custom domains
      domain: process.env.SESSION_COOKIE_DOMAIN || void 0
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
