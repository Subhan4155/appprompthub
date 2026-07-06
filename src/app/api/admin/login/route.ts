import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyPassword,
  isAdminAuthConfigured,
  createSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from "@/lib/adminAuth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Admin authentication is not configured on the server." },
      { status: 503 }
    );
  }

  const rl = rateLimit(`admin-login:${clientIp(request)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const password = body?.password;
  if (typeof password !== "string" || !verifyPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "Admin authentication is not configured on the server." },
      { status: 503 }
    );
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
