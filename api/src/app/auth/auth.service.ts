import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Response } from "express";
import { RefreshTokenModel } from "../../db/models/refresh-token.model.js";
import { UserModel, type UserDocument } from "../../db/models/user.model.js";
import { isProduction } from "../../env.js";
import { AppError } from "../shared/errors.js";
import { signAccess, signRefresh, verifyRefresh } from "../shared/jwt.js";
import {
  ACCESS_COOKIE_MAX_AGE_MS,
  ACCESS_COOKIE_NAME,
  BCRYPT_ROUNDS,
  REFRESH_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_NAME,
} from "./auth.constants.js";
import type { PublicIdentity } from "./auth.types.js";

const INVALID_LOGIN = "Invalid email or password.";

function cookieOptions(maxAge?: number) {
  // Cross-site cookies need SameSite=None, which browsers only accept over
  // HTTPS. On localhost the two dev servers are same-site, so Lax works and
  // keeps the cookie flowing without TLS.
  const production = isProduction();
  const base = {
    httpOnly: true,
    secure: production,
    sameSite: production ? ("none" as const) : ("lax" as const),
    path: "/",
  };
  return maxAge === undefined ? base : { ...base, maxAge };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, cookieOptions(ACCESS_COOKIE_MAX_AGE_MS));
  res.cookie(
    REFRESH_COOKIE_NAME,
    refreshToken,
    cookieOptions(REFRESH_COOKIE_MAX_AGE_MS),
  );
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions());
}

function toIdentity(user: UserDocument): PublicIdentity {
  return {
    id: user._id.toString(),
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

async function issueTokenPair(userId: string) {
  const jti = randomUUID();
  const accessToken = signAccess(userId);
  const refreshToken = signRefresh(userId, jti);

  await RefreshTokenModel.create({
    user: userId,
    jti,
    expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS),
  });

  return { accessToken, refreshToken };
}

export async function signup(email: string, password: string) {
  const normalised = email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email: normalised }).lean();
  if (existing) {
    throw AppError.conflict("An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user: UserDocument;
  try {
    user = await UserModel.create({ email: normalised, passwordHash });
  } catch (error) {
    // Two concurrent signups can both pass the check above; the unique index
    // is what actually decides the winner.
    if (isDuplicateKeyError(error)) {
      throw AppError.conflict("An account with that email already exists.");
    }
    throw error;
  }

  const tokens = await issueTokenPair(user._id.toString());
  return { ...tokens, identity: toIdentity(user) };
}

export async function login(email: string, password: string) {
  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    // Still hash something so a missing account and a wrong password take a
    // comparable amount of time.
    await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    throw AppError.unauthenticated(INVALID_LOGIN);
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw AppError.unauthenticated(INVALID_LOGIN);
  }

  const tokens = await issueTokenPair(user._id.toString());
  return { ...tokens, identity: toIdentity(user) };
}

export async function rotateRefresh(token: string) {
  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    throw AppError.unauthenticated("Authentication required.");
  }

  const stored = await RefreshTokenModel.findOneAndUpdate(
    { jti: payload.jti, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
  );
  if (!stored) {
    throw AppError.unauthenticated("Authentication required.");
  }

  const user = await UserModel.findById(payload.sub);
  if (!user) {
    throw AppError.unauthenticated("Authentication required.");
  }

  const tokens = await issueTokenPair(user._id.toString());
  return { ...tokens, identity: toIdentity(user) };
}

export async function revokeRefresh(token: string | undefined) {
  if (!token) return;
  try {
    const payload = verifyRefresh(token);
    await RefreshTokenModel.updateOne(
      { jti: payload.jti, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  } catch {
    // Logging out with a broken token is still a successful logout.
  }
}

export async function getIdentity(userId: string): Promise<PublicIdentity> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw AppError.unauthenticated("Authentication required.");
  }
  return toIdentity(user);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}
