import jwt, { type SignOptions } from "jsonwebtoken";
import { loadEnv } from "../../env.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../auth/auth.constants.js";

export type AccessTokenPayload = {
  sub: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: "refresh";
};

function readPayload(token: string, secret: string): Record<string, unknown> {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new jwt.JsonWebTokenError("Invalid token");
  }
  return decoded;
}

export function signAccess(userId: string): string {
  const payload: AccessTokenPayload = { sub: userId, type: "access" };
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES_IN };
  return jwt.sign(payload, loadEnv().JWT_ACCESS_SECRET, options);
}

export function signRefresh(userId: string, jti: string): string {
  const payload: RefreshTokenPayload = { sub: userId, jti, type: "refresh" };
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES_IN };
  return jwt.sign(payload, loadEnv().JWT_REFRESH_SECRET, options);
}

export function verifyAccess(token: string): AccessTokenPayload {
  const decoded = readPayload(token, loadEnv().JWT_ACCESS_SECRET);
  if (decoded["type"] !== "access" || typeof decoded["sub"] !== "string") {
    throw new jwt.JsonWebTokenError("Invalid access token");
  }
  return { sub: decoded["sub"], type: "access" };
}

export function verifyRefresh(token: string): RefreshTokenPayload {
  const decoded = readPayload(token, loadEnv().JWT_REFRESH_SECRET);
  if (
    decoded["type"] !== "refresh" ||
    typeof decoded["sub"] !== "string" ||
    typeof decoded["jti"] !== "string"
  ) {
    throw new jwt.JsonWebTokenError("Invalid refresh token");
  }
  return { sub: decoded["sub"], jti: decoded["jti"], type: "refresh" };
}
