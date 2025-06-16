import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  password: text("password").notNull(), // ✅ Ensure this exists
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("daycare_admin"),
  daycareId: integer("daycare_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Daycare centers
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

// Parents
export const parents = sqliteTable("parents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  address: text("address"),
  emergencyContact: text("emergency_contact"), // 👈 add this
  notes: text("notes"), // 👈 add this
   isBlacklisted: integer("is_blacklisted", { mode: "boolean" }).default(false),
  paymentTier: text("payment_tier").default("good"),
  totalOwed: real("total_owed").default(0),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Children
export const children = sqliteTable("children", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth"), // Store as ISO string
  parentId: integer("parent_id").references(() => parents.id),
  createdAt: integer("created_at"),
  currentDaycareId: integer("current_daycare_id"),
  allergies: text("allergies"),
  medicalNotes: text("medical_notes"),
  emergencyContacts: text("emergency_contacts"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Enrollments
export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").references(() => children.id),
  daycareId: integer("daycare_id").references(() => daycares.id),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").default("active"), // active, inactive, pending
  reasonForLeaving: text("reason_for_leaving"),
  monthlyFee: real("monthly_fee"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Payments
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentId: integer("parent_id").references(() => parents.id),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  amount: real("amount").notNull(),
  dueDate: text("due_date"),
  paidDate: text("paid_date"),
  status: text("status").default("pending"), // pending, paid, overdue
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Payment alerts
export const paymentAlerts = sqliteTable("payment_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentId: integer("parent_id").references(() => parents.id),
  daycareId: integer("daycare_id").references(() => daycares.id),
  alertType: text("alert_type").notNull(), // overdue, missed_payment, pattern_concern
  message: text("message").notNull(),
  severity: text("severity").default("medium"), // low, medium, high
  isResolved: integer("is_resolved").default(0), // SQLite boolean as integer
  resolvedBy: text("resolved_by"),
  resolvedAt: integer("resolved_at"),
  createdAt: integer("created_at"),
});

// Relations
export const parentsRelations = relations(parents, ({ many }) => ({
  children: many(children),
  payments: many(payments),
  alerts: many(paymentAlerts),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(parents, {
    fields: [children.parentId],
    references: [parents.id],
  }),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  child: one(children, {
    fields: [enrollments.childId],
    references: [children.id],
  }),
  daycare: one(daycares, {
    fields: [enrollments.daycareId],
    references: [daycares.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  parent: one(parents, {
    fields: [payments.parentId],
    references: [parents.id],
  }),
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Parent = typeof parents.$inferSelect;
export type InsertParent = typeof parents.$inferInsert;
export type Child = typeof children.$inferSelect;
export type InsertChild = typeof children.$inferInsert;
export type Daycare = typeof daycares.$inferSelect;
export type InsertDaycare = typeof daycares.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type PaymentAlert = typeof paymentAlerts.$inferSelect;
export type InsertPaymentAlert = typeof paymentAlerts.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertParentSchema = createInsertSchema(parents);
export const insertChildSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  parentId: z.number().int().positive(),
  createdAt: z.number().optional(),
  currentDaycareId: z.number().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.string().optional(),
  isActive: z.boolean().optional(),
  updatedAt: z.number().optional(),
});



export const insertDaycareSchema = createInsertSchema(daycares);
export const insertEnrollmentSchema = createInsertSchema(enrollments);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertPaymentAlertSchema = createInsertSchema(paymentAlerts);