import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors.js";
import { verifyAccess } from "../shared/jwt.js";
import { ACCESS_COOKIE_NAME } from "./auth.constants.js";
import "./auth.types.js";

/**
 * Reads the access token from the httpOnly cookie, falling back to a
 * `Authorization: Bearer <token>` header so the API stays usable from curl
 * and Postman.
 */
function readAccessToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }
  const header = req.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim() || undefined;
  }
  return undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readAccessToken(req);
  if (!token) {
    next(AppError.unauthenticated("Authentication required."));
    return;
  }

  try {
    const payload = verifyAccess(token);
    req.auth = { id: payload.sub };
    next();
  } catch {
    next(AppError.unauthenticated("Authentication required."));
  }
}
