// server/localAuth.ts
import express from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { db } from "./db";
import { users, daycares, memberships } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const isProd = process.env.NODE_ENV === "production";

/* -------------------- helpers & types -------------------- */
type SessionUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "system_admin" | "owner" | "staff" | string;
  activeDaycareId: number | null;
  memberships: Array<{ daycareId: number; daycareName: string | null; role: "owner" | "staff" | string }>;
  accessibleDaycares: Array<{ id: number; name: string | null; role: "owner" | "staff" | string }>; // ← add this
};


function isAdmin(u: SessionUser | any) {
  return u?.role === "admin" || u?.role === "system_admin";
}
function isOwner(u: SessionUser | any) {
  return u?.role === "owner";
}
function canCreateDaycare(u: SessionUser | any) {
  // business rule: only admin or owner can create daycares
  return isAdmin(u) || isOwner(u);
}

async function loadMembershipsForUser(userId: string) {
  const rows = await db
    .select({
      daycareId: memberships.daycareId,
      role: memberships.role,
      daycareName: daycares.name,
    })
    .from(memberships)
    .leftJoin(daycares, eq(memberships.daycareId, daycares.id))
    .where(eq(memberships.userId, userId));

  return rows.map((r) => ({
    daycareId: r.daycareId!,
    daycareName: r.daycareName ?? null,
    role: (r.role as "owner" | "staff") ?? "staff",
  }));
}

async function buildSessionUser(u: typeof users.$inferSelect): Promise<SessionUser> {
  const m = await loadMembershipsForUser(u.id);
  let active: number | null = (u as any).activeDaycareId ?? null;
  if (!active || !m.some((x) => x.daycareId === active)) {
    active = m.length ? m[0].daycareId : null;
  }
  return {
    id: u.id,
    email: u.email ?? null,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    role: (u.role as any) ?? "staff",
    activeDaycareId: active,
    memberships: m,
    accessibleDaycares: m.map(mm => ({ id: mm.daycareId, name: mm.daycareName, role: mm.role }))
  };
}

async function persistActive(userId: string, daycareId: number | null) {
  await db.update(users).set({ activeDaycareId: daycareId ?? null, updatedAt: new Date() }).where(eq(users.id, userId));
}

const norm = (s?: string | null) => (s ?? "").trim();
const normEmail = (s?: string | null) => norm(s).toLowerCase();

/* -------------------- main -------------------- */
export function setupLocalAuth(app: express.Express) {
  /**
   * Register a daycare (public or authenticated):
   * - If logged OUT → create daycare + first OWNER user
   * - If logged IN (admin/owner) → create daycare + add membership(OWNER) for current user
   * - If logged IN but staff → 403
   */
  app.post("/api/auth/register-daycare", async (req: any, res) => {
    // normalize inputs
    const daycareName = norm(req.body.daycareName);
    const address = norm(req.body.address);
    const daycareEmail = normEmail(req.body.daycareEmail);
    const phone = norm(req.body.phone) || null;
    const licenseNumber = norm(req.body.licenseNumber) || null;
    const capacityRaw = req.body.capacity;
    const capacity = capacityRaw === undefined || capacityRaw === null || capacityRaw === ""
      ? null
      : Number(capacityRaw);

    // logged-out owner credentials (if creating first user)
    const email = normEmail(req.body.email);
    const password = String(req.body.password ?? "");
    const firstName = norm(req.body.firstName) || null;
    const lastName = norm(req.body.lastName) || null;

    if (!daycareName || !address) {
      return res.status(400).json({ message: "Missing fields (daycareName, address)" });
    }
    if (Number.isNaN(capacity as any)) {
      return res.status(400).json({ message: "capacity must be a number if provided" });
    }

    const loggedIn = !!req.session?.user;

    try {
      // If logged in, only admin/owner can create new daycare
      if (loggedIn && !canCreateDaycare(req.session.user)) {
        return res.status(403).json({ message: "Only admin/owner can create new daycares" });
      }

      // prevent exact duplicate daycare (trimmed)
      const [existingDc] = await db
        .select({ id: daycares.id })
        .from(daycares)
        .where(and(eq(daycares.name, daycareName), eq(daycares.address, address)));
      if (existingDc) {
        return res.status(409).json({ message: "A daycare with this name & address already exists" });
      }

      const result = db.transaction((tx) => {
        // 1) create daycare
        const dcInsert = tx
          .insert(daycares)
          .values({
            name: daycareName,
            address,
            phone,
            email: daycareEmail || null,
            licenseNumber,
            capacity: capacity ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .run();

        const daycareId = Number(dcInsert.lastInsertRowid);

        // 2) either attach current user OR create a new owner user
        let createdUser:
          | (typeof users.$inferSelect & { activeDaycareId?: number | null })
          | undefined = undefined;

        if (loggedIn) {
          const currentUser = req.session.user as SessionUser;

          const [u] = tx.select().from(users).where(eq(users.id, currentUser.id)).all();
          if (!u) throw new Error("Current user not found");

          // add membership as OWNER
          tx.insert(memberships).values({
            userId: u.id,
            daycareId,
            role: "owner",
            createdAt: new Date(),
          }).run();

          // set active if none
          if (!(u as any).activeDaycareId) {
            tx.update(users).set({ activeDaycareId: daycareId, updatedAt: new Date() }).where(eq(users.id, u.id)).run();
          }
        } else {
          // Logged OUT → must create first owner user
          if (!email || !password) {
            throw new Error("Missing email or password for first owner");
          }
          // dedupe user email
          const [existingUser] = tx.select({ id: users.id }).from(users).where(eq(users.email, email)).all();
          if (existingUser) throw new Error("Email already in use");

          const userId = randomUUID();
          const hashed = bcrypt.hashSync(password, 10);

          tx.insert(users).values({
            id: userId,
            email,
            password: hashed,
            firstName,
            lastName,
            role: "owner",              // global role
            activeDaycareId: daycareId, // start in this org
            createdAt: new Date(),
            updatedAt: new Date(),
          }).run();

          tx.insert(memberships).values({
            userId,
            daycareId,
            role: "owner",
            createdAt: new Date(),
          }).run();

          createdUser = tx.select().from(users).where(eq(users.id, userId)).all()[0];
        }

        const dc = tx.select().from(daycares).where(eq(daycares.id, daycareId)).all()[0];
        return { daycare: dc, createdUser, daycareId };
      });

      // If we created a brand-new user, log them in
      if (result.createdUser) {
        const sessionUser = await buildSessionUser(result.createdUser);
        (req.session as any).user = sessionUser;
        return res.json({ user: sessionUser, daycare: result.daycare });
      }

      // If we attached to the current user, refresh their session
      const [freshUser] = await db.select().from(users).where(eq(users.id, (req.session as any).user.id));
      const refreshed = await buildSessionUser(freshUser);
      (req.session as any).user = refreshed;
      return res.json({ user: refreshed, daycare: result.daycare });
    } catch (e: any) {
      console.error("register-daycare error", e);
      // choose better status codes for common cases
      if (e?.message === "Email already in use") return res.status(409).json({ message: e.message });
      if (e?.message === "Missing email or password for first owner") return res.status(400).json({ message: e.message });
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const email = normEmail(req.body.email);
    const password = String(req.body.password ?? "");

    try {
      const [u] = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          activeDaycareId: users.activeDaycareId,
        })
        .from(users)
        .where(eq(users.email, email));

      if (!u) return res.status(401).json({ message: "Invalid credentials" });

      const ok = await bcrypt.compare(password, u.password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      // ensure there's an active daycare
      let activeDaycareId = u.activeDaycareId ?? null;
      if (!activeDaycareId) {
        const ms = await db.select().from(memberships).where(eq(memberships.userId, u.id));
        if (ms.length) {
          activeDaycareId = ms[0].daycareId;
          await db.update(users).set({ activeDaycareId, updatedAt: new Date() }).where(eq(users.id, u.id));
        }
      }

      const sessionUser = await buildSessionUser({ ...u, activeDaycareId } as any);
      (req.session as any).user = sessionUser;

      res.json(sessionUser);
    } catch (error) {
      console.error("🚨 Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Switch active daycare (owner/staff)
  async function handleSwitchDaycare(req: any, res: any) {
    const u = req.session?.user as SessionUser | undefined;
    if (!u) return res.status(401).json({ message: "Not authenticated" });

    const daycareId = Number(req.body.daycareId);
    if (!daycareId) return res.status(400).json({ message: "daycareId required" });

    // Admins can switch to any daycare; others must be members
    const allowed = isAdmin(u) || u.memberships.some((m) => m.daycareId === daycareId);
    if (!allowed) return res.status(403).json({ message: "Not a member of that daycare" });

    await persistActive(u.id, daycareId);

    const [freshUser] = await db.select().from(users).where(eq(users.id, u.id));
    const sessionUser = await buildSessionUser(freshUser);
    (req.session as any).user = sessionUser;

    res.json(sessionUser);
    // (client can just refetch /api/auth/user after calling this)
  }

  app.post("/api/auth/switch-daycare", handleSwitchDaycare);
  // Backwards-compatible alias used by older clients / routes
  app.post("/api/auth/active-daycare", handleSwitchDaycare);

  // List my memberships (handy for a dropdown UI)
  app.get("/api/auth/memberships", async (req: any, res) => {
    const u = req.session?.user as SessionUser | undefined;
    if (!u) return res.status(401).json({ message: "Not authenticated" });
    const list = await loadMembershipsForUser(u.id);
    res.json({ activeDaycareId: u.activeDaycareId, memberships: list });
  });

  // Who am I
  app.get("/api/auth/user", (req, res) => {
    const user = (req.session as any)?.user;
    if (user) return res.json(user);
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Logout
 app.post("/api/auth/logout", async (req: any, res) => {
  try {
    // destroy the session
    const sid = req.session?.id;
    req.session?.destroy?.(() => {});
    // clear the cookie (common session cookie names shown; keep one that you use)
    res.clearCookie("connect.sid");
    res.clearCookie("sid");
    res.status(204).end();
  } catch (e) {
    console.error("Logout error:", e);
    res.status(500).json({ message: "Logout failed" });
  }
});

  
}

/* -------------------- auth guard -------------------- */
export const isAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user = (req.session as any)?.user;
  if (user) {
    (req as any).user = user;
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
