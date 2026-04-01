import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { ForbiddenError } from "@shared/_core/errors";

const BCRYPT_ROUNDS = 12;

export type SessionPayload = {
  userId: number;
  openId: string;
  name: string;
};

function getSessionSecret() {
  const secret = ENV.cookieSecret || "dev-secret-key";
  return new TextEncoder().encode(secret);
}

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) return new Map<string, string>();
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

/** Hash a plain-text password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verify a plain-text password against a hash */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a signed JWT session token */
export async function createSessionToken(
  payload: SessionPayload,
  expiresInMs: number = ONE_YEAR_MS
): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    userId: payload.userId,
    openId: payload.openId,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/** Verify a session token and return the payload */
export async function verifySession(
  cookieValue: string | undefined | null
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });

    const { userId, openId, name } = payload as Record<string, unknown>;

    if (typeof userId !== "number" || typeof openId !== "string" || typeof name !== "string") {
      console.warn("[Auth] Session payload missing required fields");
      return null;
    }

    return { userId, openId, name };
  } catch (error) {
    console.warn("[Auth] Session verification failed", String(error));
    return null;
  }
}

/** Authenticate an Express request from session cookie → User */
export async function authenticateRequest(req: Request): Promise<User> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySession(sessionCookie);

  if (!session) {
    throw ForbiddenError("Invalid session");
  }

  const user = await db.getUserByOpenId(session.openId);

  if (!user) {
    throw ForbiddenError("User not found");
  }

  // Update last signed in (non-fatal)
  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
  }).catch((err) => console.warn("[Auth] Failed to update lastSignedIn:", err));

  return user;
}
