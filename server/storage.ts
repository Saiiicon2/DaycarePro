import {
  users,
  daycares,
  parents,
  children,
  enrollments,
  payments,
  paymentAlerts,
  type User,
  type UpsertUser,
  type Daycare,
  type InsertDaycare,
  type Parent,
  type InsertParent,
  type Child,
  type InsertChild,
  type Enrollment,
  type InsertEnrollment,
  type Payment,
  type InsertPayment,
  type PaymentAlert,
  type InsertPaymentAlert,
  type ParentWithChildren,
  type EnrollmentWithDetails,
  type PaymentWithDetails,
  type AlertWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Daycare operations
  getDaycares(): Promise<Daycare[]>;
  getDaycare(id: number): Promise<Daycare | undefined>;
  createDaycare(daycare: InsertDaycare): Promise<Daycare>;
  updateDaycare(id: number, daycare: Partial<InsertDaycare>): Promise<Daycare>;

  // Parent operations
  getParents(search?: string): Promise<Parent[]>;
  getParent(id: number): Promise<Parent | undefined>;
  getParentByEmail(email: string): Promise<Parent | undefined>;
  getParentWithChildren(id: number): Promise<ParentWithChildren | undefined>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: number, parent: Partial<InsertParent>): Promise<Parent>;
  updateParentTier(id: number, tier: string, totalOwed: string): Promise<Parent>;

  // Child operations
  getChildren(parentId?: number): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child>;

  // Enrollment operations
  getEnrollments(daycareId?: number): Promise<EnrollmentWithDetails[]>;
  getEnrollment(id: number): Promise<EnrollmentWithDetails | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment>;

  // Payment operations
  getPayments(parentId?: number, enrollmentId?: number): Promise<PaymentWithDetails[]>;
  getPayment(id: number): Promise<PaymentWithDetails | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;

  // Alert operations
  getAlerts(resolved?: boolean): Promise<AlertWithDetails[]>;
  createAlert(alert: InsertPaymentAlert): Promise<PaymentAlert>;
  resolveAlert(id: number, resolvedBy: string): Promise<PaymentAlert>;

  // Analytics
  getDashboardStats(): Promise<{
    totalParents: number;
    goodPayers: number;
    midPayers: number;
    nonPayers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Daycare operations
  async getDaycares(): Promise<Daycare[]> {
    return await db.select().from(daycares).where(eq(daycares.isActive, true)).orderBy(daycares.name);
  }

  async getDaycare(id: number): Promise<Daycare | undefined> {
    const [daycare] = await db.select().from(daycares).where(eq(daycares.id, id));
    return daycare;
  }

  async createDaycare(daycare: InsertDaycare): Promise<Daycare> {
    const [newDaycare] = await db.insert(daycares).values(daycare).returning();
    return newDaycare;
  }

  async updateDaycare(id: number, daycare: Partial<InsertDaycare>): Promise<Daycare> {
    const [updatedDaycare] = await db
      .update(daycares)
      .set({ ...daycare, updatedAt: new Date() })
      .where(eq(daycares.id, id))
      .returning();
    return updatedDaycare;
  }

  // Parent operations
  async getParents(search?: string): Promise<Parent[]> {
    let query = db.select().from(parents);
    
    if (search) {
      query = query.where(
        or(
          ilike(parents.firstName, `%${search}%`),
          ilike(parents.lastName, `%${search}%`),
          ilike(parents.email, `%${search}%`)
        )
      );
    }
    
    return await query.orderBy(parents.lastName, parents.firstName);
  }

  async getParent(id: number): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent;
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.email, email));
    return parent;
  }

  async getParentWithChildren(id: number): Promise<ParentWithChildren | undefined> {
    const parent = await this.getParent(id);
    if (!parent) return undefined;

    const childrenList = await db.select().from(children).where(eq(children.parentId, id));
    
    return {
      ...parent,
      children: childrenList,
    };
  }

  async createParent(parent: InsertParent): Promise<Parent> {
    const [newParent] = await db.insert(parents).values(parent).returning();
    return newParent;
  }

  async updateParent(id: number, parent: Partial<InsertParent>): Promise<Parent> {
    const [updatedParent] = await db
      .update(parents)
      .set({ ...parent, updatedAt: new Date() })
      .where(eq(parents.id, id))
      .returning();
    return updatedParent;
  }

  async updateParentTier(id: number, tier: string, totalOwed: string): Promise<Parent> {
    const [updatedParent] = await db
      .update(parents)
      .set({ 
        paymentTier: tier,
        totalOwed,
        updatedAt: new Date() 
      })
      .where(eq(parents.id, id))
      .returning();
    return updatedParent;
  }

  // Child operations
  async getChildren(parentId?: number): Promise<Child[]> {
    let query = db.select().from(children);
    
    if (parentId) {
      query = query.where(eq(children.parentId, parentId));
    }
    
    return await query.orderBy(children.firstName);
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChild(id: number, child: Partial<InsertChild>): Promise<Child> {
    const [updatedChild] = await db
      .update(children)
      .set({ ...child, updatedAt: new Date() })
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  // Enrollment operations
  async getEnrollments(daycareId?: number): Promise<EnrollmentWithDetails[]> {
    let query = db
      .select({
        enrollment: enrollments,
        child: children,
        daycare: daycares,
      })
      .from(enrollments)
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(daycares, eq(enrollments.daycareId, daycares.id));
    
    if (daycareId) {
      query = query.where(eq(enrollments.daycareId, daycareId));
    }
    
    const results = await query.orderBy(desc(enrollments.startDate));
    
    return results.map(result => ({
      ...result.enrollment,
      child: result.child!,
      daycare: result.daycare!,
      payments: [], // Will be populated separately if needed
    }));
  }

  async getEnrollment(id: number): Promise<EnrollmentWithDetails | undefined> {
    const [result] = await db
      .select({
        enrollment: enrollments,
        child: children,
        daycare: daycares,
      })
      .from(enrollments)
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(daycares, eq(enrollments.daycareId, daycares.id))
      .where(eq(enrollments.id, id));
    
    if (!result) return undefined;
    
    const enrollmentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.enrollmentId, id));
    
    return {
      ...result.enrollment,
      child: result.child!,
      daycare: result.daycare!,
      payments: enrollmentPayments,
    };
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment> {
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ ...enrollment, updatedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    return updatedEnrollment;
  }

  // Payment operations
  async getPayments(parentId?: number, enrollmentId?: number): Promise<PaymentWithDetails[]> {
    let whereConditions = [];
    
    if (parentId) {
      whereConditions.push(eq(payments.parentId, parentId));
    }
    
    if (enrollmentId) {
      whereConditions.push(eq(payments.enrollmentId, enrollmentId));
    }
    
    const results = await db
      .select({
        payment: payments,
        enrollment: enrollments,
        child: children,
        daycare: daycares,
        parent: parents,
      })
      .from(payments)
      .leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(daycares, eq(enrollments.daycareId, daycares.id))
      .leftJoin(parents, eq(payments.parentId, parents.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(payments.dueDate));
    
    return results.map(result => ({
      ...result.payment,
      enrollment: {
        ...result.enrollment!,
        child: result.child!,
        daycare: result.daycare!,
      },
      parent: result.parent!,
    }));
  }

  async getPayment(id: number): Promise<PaymentWithDetails | undefined> {
    const [result] = await db
      .select({
        payment: payments,
        enrollment: enrollments,
        child: children,
        daycare: daycares,
        parent: parents,
      })
      .from(payments)
      .leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(daycares, eq(enrollments.daycareId, daycares.id))
      .leftJoin(parents, eq(payments.parentId, parents.id))
      .where(eq(payments.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.payment,
      enrollment: {
        ...result.enrollment!,
        child: result.child!,
        daycare: result.daycare!,
      },
      parent: result.parent!,
    };
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Alert operations
  async getAlerts(resolved?: boolean): Promise<AlertWithDetails[]> {
    let query = db
      .select({
        alert: paymentAlerts,
        parent: parents,
        daycare: daycares,
      })
      .from(paymentAlerts)
      .leftJoin(parents, eq(paymentAlerts.parentId, parents.id))
      .leftJoin(daycares, eq(paymentAlerts.daycareId, daycares.id));
    
    if (resolved !== undefined) {
      query = query.where(eq(paymentAlerts.isResolved, resolved));
    }
    
    const results = await query.orderBy(desc(paymentAlerts.createdAt));
    
    return results.map(result => ({
      ...result.alert,
      parent: result.parent!,
      daycare: result.daycare!,
    }));
  }

  async createAlert(alert: InsertPaymentAlert): Promise<PaymentAlert> {
    const [newAlert] = await db.insert(paymentAlerts).values(alert).returning();
    return newAlert;
  }

  async resolveAlert(id: number, resolvedBy: string): Promise<PaymentAlert> {
    const [resolvedAlert] = await db
      .update(paymentAlerts)
      .set({
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(paymentAlerts.id, id))
      .returning();
    return resolvedAlert;
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalParents: number;
    goodPayers: number;
    midPayers: number;
    nonPayers: number;
  }> {
    const [totalParents] = await db
      .select({ count: sql<number>`count(*)` })
      .from(parents);
    
    const [goodPayers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(parents)
      .where(eq(parents.paymentTier, "good_payer"));
    
    const [midPayers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(parents)
      .where(eq(parents.paymentTier, "mid_payer"));
    
    const [nonPayers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(parents)
      .where(eq(parents.paymentTier, "non_payer"));
    
    return {
      totalParents: totalParents.count,
      goodPayers: goodPayers.count,
      midPayers: midPayers.count,
      nonPayers: nonPayers.count,
    };
  }
}

export const storage = new DatabaseStorage();
