import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripeEnabled || !stripe) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET manquant" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "signature manquante" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `signature invalide: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const programSlug = session.metadata?.programSlug;

    if (userId && userId !== "guest" && programSlug) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        const current = (user.publicMetadata?.programs as string[] | undefined) ?? [];
        const next = Array.from(new Set([...current, programSlug]));
        await clerk.users.updateUserMetadata(userId, { publicMetadata: { programs: next } });
      } catch (err) {
        console.error("clerk metadata update failed", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
