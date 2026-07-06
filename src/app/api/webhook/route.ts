import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !stripeWebhookSecret) {
      return NextResponse.json({ error: "Missing stripe-signature or webhook secret" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Signature verification failed";
      return NextResponse.json({ error: `Webhook signature verification failed: ${errMsg}` }, { status: 400 });
    }

    // Handle checkout session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;
      if (metadata && metadata.promptId && metadata.userEmail) {
        const { promptId, userEmail } = metadata;
        const stripePaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

        // Insert unlock record using service role client bypassing RLS
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
          .from("unlocks")
          .insert({
            prompt_id: promptId,
            user_email: userEmail,
            stripe_payment_intent_id: stripePaymentIntentId,
          });

        if (error) {
          console.error("[webhook db insert error]", error);
          return NextResponse.json({ error: `Failed to insert unlock: ${error.message}` }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[webhook api error]", err);
    const errMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
