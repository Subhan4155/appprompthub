import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { isAdminRequestAuthenticated } from "./adminAuth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";

// Shared gate for admin write routes: verifies the session and returns a
// service-role client, or a ready-to-return error Response.
export async function requireAdminClient(): Promise<
  { admin: SupabaseClient } | { response: NextResponse }
> {
  if (!(await isAdminRequestAuthenticated())) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      response: NextResponse.json(
        { error: "Supabase service role is not configured on the server." },
        { status: 503 }
      ),
    };
  }
  return { admin: getSupabaseAdmin() };
}
