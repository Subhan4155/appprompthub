import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { PromptRow, NewsRow, rowToPrompt, rowToNews } from "@/lib/mappers";
import { mockPrompts, mockNews } from "@/data/mockData";

export const runtime = "nodejs";

// Aggregate dashboard fetch: prompts, news, and subscribers in one authorized
// call using the service-role key.
export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      configured: false,
      prompts: mockPrompts,
      news: mockNews,
      subscribers: [
        { id: "sub1", email: "builder@example.com", created_at: new Date().toISOString() },
        { id: "sub2", email: "agency@example.com", created_at: new Date().toISOString() },
      ],
    });
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
    configured: true,
    prompts: ((pRes.data as PromptRow[]) ?? []).map(rowToPrompt),
    news: ((nRes.data as NewsRow[]) ?? []).map(rowToNews),
    subscribers: sRes.data ?? [],
  });
}
