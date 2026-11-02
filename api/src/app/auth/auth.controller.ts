import type { Request, Response } from "express";
import { AppError } from "../shared/errors.js";
import { sendData } from "../shared/envelope.js";
import { parseOrThrow } from "../shared/validate.js";
import { REFRESH_COOKIE_NAME } from "./auth.constants.js";
import { credentialsSchema, loginSchema } from "./auth.schema.js";
import { assertLoginRateLimit } from "./login-rate-limit.js";
import {
  clearAuthCookies,
  getIdentity,
  login,
  revokeRefresh,
  rotateRefresh,
  setAuthCookies,
  signup,
} from "./auth.service.js";

export async function signupController(req: Request, res: Response) {
  const body = parseOrThrow(credentialsSchema, req.body);
  const result = await signup(body.email, body.password);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendData(res, result.identity, 201);
}

export async function loginController(req: Request, res: Response) {
  assertLoginRateLimit(req);
  const body = parseOrThrow(loginSchema, req.body);
  const result = await login(body.email, body.password);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  sendData(res, result.identity);
}

export async function refreshController(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof token !== "string" || token.length === 0) {
    throw AppError.unauthenticated("Authentication required.");
  }
  const next = await rotateRefresh(token);
  setAuthCookies(res, next.accessToken, next.refreshToken);
  sendData(res, next.identity);
}

export async function logoutController(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  await revokeRefresh(typeof token === "string" ? token : undefined);
  clearAuthCookies(res);
  sendData(res, { ok: true });
}

export async function meController(req: Request, res: Response) {
  if (!req.auth) {
    throw AppError.unauthenticated("Authentication required.");
  }
  sendData(res, await getIdentity(req.auth.id));
}
