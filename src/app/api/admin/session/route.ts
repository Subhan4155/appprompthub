import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated, isAdminAuthConfigured } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    authenticated: await isAdminRequestAuthenticated(),
    configured: isAdminAuthConfigured(),
  });
}
