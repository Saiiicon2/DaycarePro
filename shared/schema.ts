import {
  sqliteTable, text, integer, real, blob, primaryKey
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ------------------- Tables ------------------- */


//membership
export const insertMembershipSchema = z.object({
  userId: z.string().min(1),
  daycareId: z.number().int().positive(),
  role: z.enum(["daycare", "manager", "admin"]).default("daycare"),
  isActive: z.boolean().default(true),
});

export const membershipSchema = insertMembershipSchema.extend({
  id: z.number().int(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = z.infer<typeof membershipSchema>;

// Sessions
export const sessions = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: blob("sess", { mode: "json" }).notNull(),
  expire: integer("expire", { mode: "timestamp" }).notNull(),
});

// Users
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("staff"),          // ⬅️ global role default
  daycareId: integer("daycare_id"),                        // legacy (migration only)
  activeDaycareId: integer("active_daycare_id"),           // ⬅️ current org context
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Daycares
export const daycares = sqliteTable("daycares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  licenseNumber: text("license_number"),
  capacity: integer("capacity"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Memberships (user ↔ daycare, org-scoped role)
export const memberships = sqliteTable("memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  daycareId: integer("daycare_id").notNull(),
  role: text("role").notNull().default("owner"),  // 'owner' | 'staff'
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Parents
export const parents = sqliteTable("parents", {
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
  daycareId: integer("daycare_id"),                          // ⬅️ scope to org
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Children
export const children = sqliteTable("children", {
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
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Enrollments
export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").notNull(),
  daycareId: integer("daycare_id").notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  monthlyFee: real("monthly_fee").notNull(),
  status: text("status").notNull().default("active"),
  reasonForLeaving: text("reason_for_leaving"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Payments
export const payments = sqliteTable("payments", {
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
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Alerts
export const paymentAlerts = sqliteTable("payment_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentId: integer("parent_id").notNull(),
  daycareId: integer("daycare_id").notNull(),
  alertType: text("alert_type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("medium"),
  isResolved: integer("is_resolved", { mode: "boolean" }).default(false),
  resolvedBy: text("resolved_by"),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Audit logs for important admin actions (blacklist, alerts, invoices)
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(), // e.g. 'blacklist', 'create_alert', 'create_invoice'
  actorId: text("actor_id"), // user id who performed the action
  targetType: text("target_type"), // e.g. 'parent', 'alert', 'payment'
  targetId: text("target_id"), // stringified id (nullable)
  daycareId: integer("daycare_id"), // optional org scope
  payload: blob("payload", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

/* ------------------- Relations (after all tables) ------------------- */

export const usersRelations = relations(users, ({ one, many }) => ({
  daycare: one(daycares, { fields: [users.daycareId], references: [daycares.id] }),      // legacy
  activeDaycare: one(daycares, { fields: [users.activeDaycareId], references: [daycares.id] }),
  memberships: many(memberships),
}));

export const daycaresRelations = relations(daycares, ({ many }) => ({
  users: many(users),
  memberships: many(memberships),
  enrollments: many(enrollments),
  alerts: many(paymentAlerts),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  daycare: one(daycares, { fields: [memberships.daycareId], references: [daycares.id] }),
}));

export const parentsRelations = relations(parents, ({ one, many }) => ({
  daycare: one(daycares, { fields: [parents.daycareId], references: [daycares.id] }),     // ⬅️ added
  children: many(children),
  payments: many(payments),
  alerts: many(paymentAlerts),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(parents, { fields: [children.parentId], references: [parents.id] }),
  currentDaycare: one(daycares, { fields: [children.currentDaycareId], references: [daycares.id] }),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  child: one(children, { fields: [enrollments.childId], references: [children.id] }),
  daycare: one(daycares, { fields: [enrollments.daycareId], references: [daycares.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  enrollment: one(enrollments, { fields: [payments.enrollmentId], references: [enrollments.id] }),
  parent: one(parents, { fields: [payments.parentId], references: [parents.id] }),
}));

export const paymentAlertsRelations = relations(paymentAlerts, ({ one }) => ({
  parent: one(parents, { fields: [paymentAlerts.parentId], references: [parents.id] }),
  daycare: one(daycares, { fields: [paymentAlerts.daycareId], references: [daycares.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  daycare: one(daycares, { fields: [auditLogs.daycareId], references: [daycares.id] }),
}));

/* ------------------- Insert Schemas & Types ------------------- */

export const upsertUserSchema = createInsertSchema(users);
export const insertDaycareSchema = createInsertSchema(daycares);
export const insertParentSchema = createInsertSchema(parents);
export const insertChildSchema = z.object({
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
  updatedAt: z.number(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertPaymentAlertSchema = createInsertSchema(paymentAlerts);
export const insertAuditLogSchema = createInsertSchema(auditLogs);

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDaycare = z.infer<typeof insertDaycareSchema>;
export type Daycare = typeof daycares.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;
export type Parent = typeof parents.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPaymentAlert = z.infer<typeof insertPaymentAlertSchema>;
export type PaymentAlert = typeof paymentAlerts.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Composite/detail types used by the server
export type ParentWithChildren = Parent & { children: Child[] };
export type EnrollmentWithDetails = Enrollment & { child: Child; daycare: Daycare; payments: Payment[] };
export type PaymentWithDetails = Payment & { enrollment: Enrollment & { child: Child; daycare: Daycare }; parent: Parent };
export type AlertWithDetails = PaymentAlert & { parent: Parent; daycare: Daycare };
