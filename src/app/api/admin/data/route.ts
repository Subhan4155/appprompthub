import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { PromptRow, NewsRow, rowToPrompt, rowToNews } from "@/lib/mappers";

export const runtime = "nodejs";

// Aggregate dashboard fetch: prompts, news, and subscribers in one authorized
// call using the service-role key.
export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured on the server.", configured: false },
      { status: 503 }
    );
  }

  const admin = getSupabaseAdmin();
  const [pRes, nRes, sRes] = await Promise.all([
    admin.from("prompts").select("*").order("date", { ascending: false }),
    admin.from("news").select("*").order("date", { ascending: false }),
    admin.from("subscribers").select("*").order("created_at", { ascending: false }),
  ]);

  const firstError = pRes.error || nRes.error || sRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    prompts: ((pRes.data as PromptRow[]) ?? []).map(rowToPrompt),
    news: ((nRes.data as NewsRow[]) ?? []).map(rowToNews),
    subscribers: sRes.data ?? [],
  });
}
