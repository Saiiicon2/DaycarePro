import type { Request, Response, NextFunction } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { memberships } from "@shared/schema";

function isAdmin(u: any) {
  return u?.role === "admin" || u?.role === "system_admin";
}

/**
 * Ensures the logged-in user has an active membership for the daycare.
 * - Looks for daycareId in params/query/body, then falls back to req.user.activeDaycareId.
 * - If adminBypass=true and user is admin, it skips the membership check.
 */
export function requireMembership(
  param: string = "daycareId",
  opts: { adminBypass?: boolean } = {},
) {
  const { adminBypass = false } = opts;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.id) return res.status(401).json({ message: "Unauthenticated" });

      if (adminBypass && isAdmin(user)) {
        // Admin can proceed without scoping; handlers may treat req.daycareId as optional.
        const raw =
          (req.params as any)[param] ??
          (req.query as any)[param] ??
          (req.body as any)[param] ??
          (req as any).user?.activeDaycareId;
        const maybe = Number(raw);
        if (raw && !Number.isNaN(maybe)) (req as any).daycareId = maybe;
        return next();
      }

      const raw =
        (req.params as any)[param] ??
        (req.query as any)[param] ??
        (req.body as any)[param] ??
        (req as any).user?.activeDaycareId;

      const daycareId = Number(raw);
      if (!daycareId || Number.isNaN(daycareId)) {
        return res.status(400).json({ message: "daycareId required" });
      }

      const [row] = await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, user.id),
            eq(memberships.daycareId, daycareId),
            eq(memberships.isActive, true),
          ),
        )
        .limit(1);

      if (!row) return res.status(403).json({ message: "No access to this daycare" });

      (req as any).daycareId = daycareId;
      next();
    } catch (err) {
      next(err);
    }
  };
}
