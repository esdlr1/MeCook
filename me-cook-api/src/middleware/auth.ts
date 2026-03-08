import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { verifyAccessToken } from "../lib/auth.js";

type AuthUser = {
  id: string;
  role: UserRole;
};

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const payload = verifyAccessToken(token);
    req.authUser = { id: payload.userId, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}
