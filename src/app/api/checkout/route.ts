import { NextResponse } from "next/server";
import { hasSupabaseCredentials, supabase } from "@/lib/supabase";
import { mockPrompts as defaultMockPrompts } from "@/data/mockData";
import { rowToPrompt } from "@/lib/mappers";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
// Initialize Stripe
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: Request) {
  try {
    const { promptId, userEmail } = await request.json();
    if (!promptId || !userEmail) {
      return NextResponse.json({ error: "Missing promptId or userEmail" }, { status: 400 });
    }

    // 1. Fetch prompt details
    let prompt = null;
    if (hasSupabaseCredentials) {
      const { data } = await supabase.from("prompts").select("*").eq("id", promptId).maybeSingle();
      if (data) {
        prompt = rowToPrompt(data);
      }
    }
    if (!prompt) {
      prompt = defaultMockPrompts.find((p) => p.id === promptId);
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Resolve price
    const priceCents = prompt.priceCents || 0;
    if (priceCents <= 0) {
      return NextResponse.json({ error: "Prompt is free, no checkout required" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "";

    // 2. Stripe Checkout session creation
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: prompt.title,
                description: prompt.description,
              },
              unit_amount: priceCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: userEmail,
        metadata: {
          promptId,
          userEmail,
        },
        success_url: `${origin}/prompt/${prompt.slug}?unlocked=true`,
        cancel_url: `${origin}/prompt/${prompt.slug}?cancelled=true`,
      });

      return NextResponse.json({ url: session.url });
    } else {
      // 3. Fallback to Simulated Mock Checkout URL for sandbox testing
      const mockCheckoutUrl = `/prompt/${prompt.slug}?mock_checkout=true&promptId=${prompt.id}&email=${encodeURIComponent(userEmail)}`;
      return NextResponse.json({ url: mockCheckoutUrl });
    }
  } catch (err: unknown) {
    console.error("[checkout api error]", err);
    const errMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
