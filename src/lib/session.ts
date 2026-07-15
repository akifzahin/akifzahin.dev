import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(import.meta.env.SESSION_SECRET);
const COOKIE_NAME = "admin_session";
const EXPIRY = "30d"; // long-lived, since this is a single-user personal tool

export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch (err) {
    console.error("Session verify failed:", err);
    return false;
  }
}

export { COOKIE_NAME };
