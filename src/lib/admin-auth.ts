import { timingSafeEqual } from "crypto";
import { jwtVerify, SignJWT } from "jose";

export const ADMIN_COOKIE = "kelvjessia_admin";
const encoder = new TextEncoder();

function signingKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be configured.");
  return encoder.encode(secret);
}

export function validAdminPassword(attempt: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const actualBytes = Buffer.from(attempt);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function createAdminSession() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(signingKey());
}

export async function isAdminSession(token?: string) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, signingKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}
