import {
    users,
  daycares,
  parents,
  children,
  enrollments,
  payments,
  paymentAlerts,
  memberships,                //  add this
  auditLogs,
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
  type InsertAuditLog,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or } from "drizzle-orm";



//membership
// upsert (idempotent by UNIQUE(user_id, daycare_id))

export interface IStorage {
    // Users
  getUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;   //  rename from getUsers -> getUser
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Daycares
  getDaycares(): Promise<Daycare[]>;
  getDaycare(id: number): Promise<Daycare | undefined>;
  createDaycare(daycare: InsertDaycare): Promise<Daycare>;
  updateDaycare(id: number, daycare: Partial<InsertDaycare>): Promise<Daycare>;

  // Parents
  getParents(search?: string, daycareId?: number): Promise<Parent[]>; //  match impl
  getParent(id: number): Promise<Parent | undefined>;
  getParentByEmail(email: string): Promise<Parent | undefined>;
  getParentWithChildren(id: number): Promise<ParentWithChildren | undefined>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: number, parent: Partial<InsertParent>): Promise<Parent>;
  updateParentTier(id: number, tier: string, totalOwed: number): Promise<Parent>;

  // Children
  getChildren(parentId?: number, daycareId?: number): Promise<Child[]>; // ✅ match impl
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child>;

  // Enrollments
  getEnrollments(daycareId?: number): Promise<EnrollmentWithDetails[]>;
  getEnrollment(id: number): Promise<EnrollmentWithDetails | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment>;

  // Payments
  getPayments(parentId?: number, enrollmentId?: number, daycareId?: number): Promise<PaymentWithDetails[]>; // ✅ match impl
  getPayment(id: number): Promise<PaymentWithDetails | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;

  // Alerts
  getAlerts(resolved?: boolean, daycareId?: number): Promise<AlertWithDetails[]>; // ✅ match impl
  createAlert(alert: InsertPaymentAlert): Promise<PaymentAlert>;
  resolveAlert(id: number, resolvedBy: string): Promise<PaymentAlert>;

  // Audit logs
  addAudit(entry: Partial<InsertAuditLog> & { action: string; actorId?: string | null; targetType?: string | null; targetId?: string | null; daycareId?: number | null; payload?: any }): Promise<AuditLog>;
  getAudits(filter?: { daycareId?: number; actorId?: string; action?: string; limit?: number }): Promise<AuditLog[]>;

  // Memberships
  getMemberships(userId: string): Promise<any[]>; // or a Membership type if you have one
  addMembership(userId: string, daycareId: number, role?: "daycare" | "manager" | "admin"): Promise<any>;
  removeMembership(userId: string, daycareId: number): Promise<void>;
  updateMembership(userId: string, daycareId: number, updates: { role?: string; isActive?: boolean }): Promise<any>;
  userCanAccessDaycare(userId: string, daycareId: number): Promise<boolean>;

  // Analytics
  getDashboardStats(): Promise<{
    totalParents: number;
    goodPayers: number;
    midPayers: number;
    nonPayers: number;
  }>;
}

export class DatabaseStorage implements IStorage {

// Daycares the user can access (via memberships). Admins won’t use this.
async getUserDaycares(userId: string) {
  const rows = await db
    .select({
      id: daycares.id,
      name: daycares.name,
      address: daycares.address,
      phone: daycares.phone,
      isActive: daycares.isActive,
    })
    .from(memberships)
    .leftJoin(daycares, eq(memberships.daycareId, daycares.id))
    .where(and(
      eq(memberships.userId, userId),
      eq(memberships.isActive, true),
      eq(daycares.isActive, true),
    ))
    .orderBy(daycares.name);

  return rows;
}


   async getMemberships(userId: string) {
    return await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId));
  }

  async addMembership(
    userId: string,
    daycareId: number,
    role: "daycare" | "manager" | "admin" = "daycare"
  ) {
    const [row] = await db.insert(memberships)
      .values({ userId, daycareId, role, isActive: true })
      .onConflictDoNothing()
      .returning();
    return row;
  }

  async removeMembership(userId: string, daycareId: number) {
    await db.delete(memberships)
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.daycareId, daycareId)
      ));
  }

  async updateMembership(userId: string, daycareId: number, updates: { role?: string; isActive?: boolean }) {
    const setObj: any = {};
    if (updates.role !== undefined) setObj.role = updates.role;
    if (updates.isActive !== undefined) setObj.isActive = updates.isActive;

    const [row] = await db.update(memberships).set(setObj).where(and(eq(memberships.userId, userId), eq(memberships.daycareId, daycareId))).returning();
    return row;
  }

  async userCanAccessDaycare(userId: string, daycareId: number) {
    const [row] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.daycareId, daycareId),
        eq(memberships.isActive, true)
      ))
      .limit(1);
    return !!row;
  }
  async getUsers(): Promise<User[]> {
  return await db.select().from(users);
}

async createUser(user: UpsertUser): Promise<User> {
  const [newUser] = await db.insert(users).values(user).returning();
  return newUser;
}
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    // return raw DB row; caller will build session user as needed
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
  .select({
    id: users.id,
    email: users.email,
    password: users.password, // ✅ include this explicitly
    firstName: users.firstName,
    lastName: users.lastName,
    profileImageUrl: users.profileImageUrl,
    role: users.role,
    daycareId: users.daycareId,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  })
  .from(users)
  .where(eq(users.email, email));
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

  // Parents
async getParents(search?: string, daycareId?: number): Promise<Parent[]> {
  const conds: any[] = [];

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    // SQLite: case-insensitive search using lower(...) LIKE ...
    conds.push(
      or(
        sql<boolean>`lower(${parents.firstName}) LIKE ${term}`,
        sql<boolean>`lower(${parents.lastName})  LIKE ${term}`,
        sql<boolean>`lower(${parents.email})     LIKE ${term}`
      )
    );
  }

  if (daycareId) conds.push(eq(parents.daycareId, daycareId));

  if (conds.length) {
    return await db
      .select()
      .from(parents)
      .where(and(...conds))
      .orderBy(parents.lastName, parents.firstName);
  } else {
    return await db
      .select()
      .from(parents)
      .orderBy(parents.lastName, parents.firstName);
  }
}


  async getParent(id: number): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent;
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    console.log('email:',email);
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

  async updateParentTier(id: number, tier: string, totalOwed: number): Promise<Parent> {
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
async getChildren(parentId?: number, daycareId?: number): Promise<Child[]> {
  const conds: any[] = [];
  if (parentId)  conds.push(eq(children.parentId, parentId));
  if (daycareId) conds.push(eq(children.currentDaycareId, daycareId));

  if (conds.length) {
    return await db
      .select()
      .from(children)
      .where(and(...conds))
      .orderBy(children.firstName);
  } else {
    return await db
      .select()
      .from(children)
      .orderBy(children.firstName);
  }
}


  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  // Counts and cascade helpers for safe deletes
  async countPaymentsByParent(parentId: number): Promise<number> {
    const [r] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.parentId, parentId));
    return r.count || 0;
  }

  async countEnrollmentsByChild(childId: number): Promise<number> {
    const [r] = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.childId, childId));
    return r.count || 0;
  }

  // Delete payments for a parent
  async deletePaymentsByParent(parentId: number): Promise<void> {
    await db.delete(payments).where(eq(payments.parentId, parentId));
  }

  // Delete payments for a set of enrollment IDs
  async deletePaymentsByEnrollmentIds(enrollmentIds: number[]): Promise<void> {
    if (!enrollmentIds || enrollmentIds.length === 0) return;
    await db.delete(payments).where(sql`enrollment_id IN (${sql.join(enrollmentIds.map(() => sql`?`), sql`,`)})`, ...enrollmentIds as any);
  }

  // Delete enrollments for a child
  async deleteEnrollmentsByChild(childId: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.childId, childId));
  }

  // Delete children for a parent
  async deleteChildrenByParent(parentId: number): Promise<void> {
    await db.delete(children).where(eq(children.parentId, parentId));
  }

  // Cascade delete: child -> enrollments -> payments -> child
  async deleteChildCascade(childId: number): Promise<void> {
    // find enrollments
    const enrs = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.childId, childId));
    const ids = enrs.map((e: any) => e.id).filter(Boolean) as number[];
    if (ids.length) {
      await this.deletePaymentsByEnrollmentIds(ids);
      await db.delete(enrollments).where(sql`id IN (${sql.join(ids.map(() => sql`?`), sql`,`)})`, ...ids as any);
    }
    await db.delete(children).where(eq(children.id, childId));
  }

  // Cascade delete for parent: payments (by parent), for each child delete enrollments/payments then children, then parent
  async deleteParentCascade(parentId: number): Promise<void> {
    // delete payments directly tied to parent
    await this.deletePaymentsByParent(parentId);

    // find children
    const childRows = await db.select({ id: children.id }).from(children).where(eq(children.parentId, parentId));
    const childIds = childRows.map((c: any) => c.id).filter(Boolean) as number[];

    for (const cid of childIds) {
      await this.deleteChildCascade(cid);
    }

    await db.delete(parents).where(eq(parents.id, parentId));
  }

    // List enrollments (optionally scoped to a daycare)
    async getEnrollments(daycareId?: number): Promise<EnrollmentWithDetails[]> {
      const conds: any[] = [];
      if (daycareId) conds.push(eq(enrollments.daycareId, daycareId));

      const base = db
        .select({ enrollment: enrollments, child: children, daycare: daycares })
        .from(enrollments)
        .leftJoin(children, eq(enrollments.childId, children.id))
        .leftJoin(daycares, eq(enrollments.daycareId, daycares.id));

      const q = conds.length ? base.where(and(...conds)) : base;

      const rows = await q.orderBy(desc(enrollments.createdAt));

      // fetch payments for each enrollment and attach
      const results: EnrollmentWithDetails[] = [];
      for (const r of rows) {
        const pay = await db.select().from(payments).where(eq(payments.enrollmentId, r.enrollment.id));
        results.push({ ...r.enrollment, child: r.child!, daycare: r.daycare!, payments: pay });
      }

      return results;
    }

 async createChild(child: InsertChild): Promise<Child> {
  console.log(" Incoming child data:", child);

  const parsedChild = {
    ...child,
    createdAt: new Date(Number(child.createdAt)),
    updatedAt: new Date(Number(child.updatedAt)),
    dateOfBirth: new Date(child.dateOfBirth), //  convert ISO string to Date
  };

  console.log(" Parsed child data before insert:", parsedChild);

  const [newChild] = await db.insert(children).values(parsedChild).returning();
  return newChild;
}
  async updateChild(id: number, child: Partial<InsertChild>): Promise<Child> {
    const sanitized: any = { ...child };
    if (sanitized.createdAt !== undefined) sanitized.createdAt = new Date(Number(sanitized.createdAt));
    if (sanitized.dateOfBirth !== undefined) sanitized.dateOfBirth = new Date(String(sanitized.dateOfBirth));
    sanitized.updatedAt = new Date();

    const [updatedChild] = await db
      .update(children)
      .set(sanitized)
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  // Delete operations (admin-only endpoints will use these)
  async deleteParent(id: number): Promise<void> {
    await db.delete(parents).where(eq(parents.id, id));
  }

  async deleteDaycare(id: number): Promise<void> {
    await db.delete(daycares).where(eq(daycares.id, id));
  }

  async deleteChild(id: number): Promise<void> {
    await db.delete(children).where(eq(children.id, id));
  }

  // Enrollment operations
async getEnrollment(id: number) {
  const [r] = await db
    .select({
      enrollment: enrollments,
      child: children,
      daycare: daycares,
    })
    .from(enrollments)
    .leftJoin(children, eq(enrollments.childId, children.id))
    .leftJoin(daycares, eq(enrollments.daycareId, daycares.id))
    .where(eq(enrollments.id, id));

  if (!r) return undefined;

  const pay = await db
    .select()
    .from(payments)
    .where(eq(payments.enrollmentId, id));

  return {
    ...r.enrollment,
    child: r.child!,
    daycare: r.daycare!,
    payments: pay,
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
  async getPayments(
  parentId?: number,
  enrollmentId?: number,
  daycareId?: number
): Promise<PaymentWithDetails[]> {
  const conds: any[] = [];
  if (parentId)     conds.push(eq(payments.parentId, parentId));
  if (enrollmentId) conds.push(eq(payments.enrollmentId, enrollmentId));
  if (daycareId)    conds.push(eq(enrollments.daycareId, daycareId)); // via join

  const base = db
    .select({
      payment: payments,
      enrollment: enrollments,
      child: children,
      daycare: daycares,
      parent: parents,
    })
    .from(payments)
    .leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
    .leftJoin(children,   eq(enrollments.childId,  children.id))
    .leftJoin(daycares,   eq(enrollments.daycareId, daycares.id))
    .leftJoin(parents,    eq(payments.parentId, parents.id));

  const q = conds.length ? base.where(and(...conds)) : base;

  const results = await q.orderBy(desc(payments.dueDate));
  return results.map(r => ({
    ...r.payment,
    enrollment: { ...r.enrollment!, child: r.child!, daycare: r.daycare! },
    parent: r.parent!,
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

//   async getMemberships(userId: string) {
//   return await db.select().from(memberships).where(eq(memberships.userId, userId));
// }



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
async getAlerts(resolved?: boolean, daycareId?: number): Promise<AlertWithDetails[]> {
  const conds: any[] = [];
  if (resolved !== undefined) conds.push(eq(paymentAlerts.isResolved, resolved));
  if (daycareId)              conds.push(eq(paymentAlerts.daycareId, daycareId));

  const base = db
    .select({ alert: paymentAlerts, parent: parents, daycare: daycares })
    .from(paymentAlerts)
    .leftJoin(parents, eq(paymentAlerts.parentId, parents.id))
    .leftJoin(daycares, eq(paymentAlerts.daycareId, daycares.id));

  const q = conds.length ? base.where(and(...conds)) : base;

  const results = await q.orderBy(desc(paymentAlerts.createdAt));
  return results.map(r => ({ ...r.alert, parent: r.parent!, daycare: r.daycare! }));
}

  async createAlert(alert: InsertPaymentAlert): Promise<PaymentAlert> {
    const [newAlert] = await db.insert(paymentAlerts).values(alert).returning();
    return newAlert;
  }

  // Audit log operations
  async addAudit(entry: Partial<InsertAuditLog> & { action: string; actorId?: string | null; targetType?: string | null; targetId?: string | null; daycareId?: number | null; payload?: any }): Promise<AuditLog> {
    const toInsert: any = {
      action: entry.action,
      actorId: entry.actorId ?? null,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId != null ? String(entry.targetId) : null,
      daycareId: entry.daycareId ?? null,
      payload: entry.payload ?? {},
      createdAt: new Date(),
    };

    const [row] = await db.insert(auditLogs).values(toInsert).returning();
    return row;
  }

  async getAudits(filter?: { daycareId?: number; actorId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
    const conds: any[] = [];
    if (filter?.daycareId) conds.push(eq(auditLogs.daycareId, filter.daycareId));
    if (filter?.actorId) conds.push(eq(auditLogs.actorId, filter.actorId));
    if (filter?.action) conds.push(eq(auditLogs.action, filter.action));

    const q = conds.length ? db.select().from(auditLogs).where(and(...conds)) : db.select().from(auditLogs);
    const rows = await q.orderBy(desc(auditLogs.createdAt)).limit(filter?.limit ?? 100);
    return rows;
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
