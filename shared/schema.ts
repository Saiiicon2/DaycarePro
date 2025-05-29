import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("daycare_admin"), // daycare_admin, system_admin
  daycareId: integer("daycare_id"), // Reference to daycare center they manage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daycare centers
export const daycares = pgTable("daycares", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  licenseNumber: varchar("license_number"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parents
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").unique().notNull(),
  phone: varchar("phone"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  paymentTier: varchar("payment_tier").notNull().default("good_payer"), // good_payer, mid_payer, non_payer
  totalOwed: decimal("total_owed", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  isBlacklisted: boolean("is_blacklisted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Children
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  parentId: integer("parent_id").notNull(),
  currentDaycareId: integer("current_daycare_id"),
  allergies: text("allergies"),
  medicalNotes: text("medical_notes"),
  emergencyContacts: text("emergency_contacts"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enrollments (tracks child enrollment history across daycares)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  daycareId: integer("daycare_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("active"), // active, completed, terminated
  reasonForLeaving: text("reason_for_leaving"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  parentId: integer("parent_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: varchar("status").notNull().default("pending"), // pending, paid, overdue, cancelled
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment alerts (for tracking flagged enrollment attempts)
export const paymentAlerts = pgTable("payment_alerts", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  daycareId: integer("daycare_id").notNull(),
  alertType: varchar("alert_type").notNull(), // enrollment_attempt, overdue_payment, tier_change
  message: text("message").notNull(),
  severity: varchar("severity").notNull().default("medium"), // low, medium, high
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  daycare: one(daycares, {
    fields: [users.daycareId],
    references: [daycares.id],
  }),
}));

export const daycaresRelations = relations(daycares, ({ many }) => ({
  enrollments: many(enrollments),
  users: many(users),
  alerts: many(paymentAlerts),
}));

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
  currentDaycare: one(daycares, {
    fields: [children.currentDaycareId],
    references: [daycares.id],
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
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
  parent: one(parents, {
    fields: [payments.parentId],
    references: [parents.id],
  }),
}));

export const paymentAlertsRelations = relations(paymentAlerts, ({ one }) => ({
  parent: one(parents, {
    fields: [paymentAlerts.parentId],
    references: [parents.id],
  }),
  daycare: one(daycares, {
    fields: [paymentAlerts.daycareId],
    references: [daycares.id],
  }),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertDaycareSchema = createInsertSchema(daycares).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  paymentTier: true,
  totalOwed: true,
  isBlacklisted: true,
  createdAt: true,
  updatedAt: true,
});
export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPaymentAlertSchema = createInsertSchema(paymentAlerts).omit({
  id: true,
  createdAt: true,
});

// Types
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

// Extended types for UI
export type ParentWithChildren = Parent & {
  children: Child[];
};

export type EnrollmentWithDetails = Enrollment & {
  child: Child;
  daycare: Daycare;
  payments: Payment[];
};

export type PaymentWithDetails = Payment & {
  enrollment: Enrollment & {
    child: Child;
    daycare: Daycare;
  };
  parent: Parent;
};

export type AlertWithDetails = PaymentAlert & {
  parent: Parent;
  daycare: Daycare;
};
