import crypto from "node:crypto";
import { cookies } from "next/headers";

// Server-only admin authentication helpers.
// Auth is based on a signed, httpOnly session cookie. The password itself
// (`ADMIN_PASSWORD`) is never sent to the browser and never compared client-side.

export const ADMIN_COOKIE_NAME = "aph_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

/** True when an admin password is configured on the server. */
export function isAdminAuthConfigured(): boolean {
  return getAdminPassword() !== null;
}

// Secret used to sign session tokens. Prefer a dedicated secret; fall back to
// the admin password so the feature works with the existing env setup.
function getSigningSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  return secret && secret.length > 0 ? secret : null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Constant-time password check against the server-only `ADMIN_PASSWORD`. */
export function verifyPassword(candidate: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  // Hash both sides to fixed-length digests so timingSafeEqual never sees
  // mismatched lengths (which would throw and leak length info).
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function sign(payloadB64: string, secret: string): string {
  return base64url(crypto.createHmac("sha256", secret).update(payloadB64).digest());
}

/** Create a signed session token, or null if auth isn't configured. */
export function createSessionToken(): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;
  const payload = {
    sub: "admin",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;

  const expectedSig = sign(payloadB64, secret);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.sub !== "admin") return false;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Reads the session cookie from the incoming request and validates it. */
export async function isAdminRequestAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
}
