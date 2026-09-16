import type { RequestHandler } from "express";
import { forbidden, unauthorized } from "../lib/errors.js";
import { verifyAccessToken, type UserRole } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export const requireAuth: RequestHandler = (request, _response, next) => {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(unauthorized());
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    if (payload.type !== "access" || typeof payload.sub !== "string") {
      return next(unauthorized("Invalid access token"));
    }
    request.auth = {
      userId: payload.sub,
      role: payload.role ?? "FREELANCER"
    };
    return next();
  } catch {
    return next(unauthorized("Invalid or expired access token"));
  }
};

export const requireRole = (...roles: UserRole[]): RequestHandler =>
  (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return next(forbidden());
    }
    return next();
  };
