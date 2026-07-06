import { NextResponse } from "next/server";
import { hasSupabaseCredentials } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { promptId, userEmail } = await request.json();
    if (!promptId || !userEmail) {
      return NextResponse.json({ error: "Missing promptId or userEmail" }, { status: 400 });
    }

    if (hasSupabaseCredentials) {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from("unlocks")
        .insert({
          prompt_id: promptId,
          user_email: userEmail,
          stripe_payment_intent_id: "mock_sandbox_purchase_" + Math.random().toString(36).substring(7),
        });

      if (error && error.code !== "23505") { // Ignore duplicate key errors (already unlocked)
        console.error("[mock unlock db insert error]", error);
        return NextResponse.json({ error: `Failed to insert mock unlock: ${error.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[mock unlock api error]", err);
    const errMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
