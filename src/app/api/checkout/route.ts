import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { clerkEnabled } from "@/lib/clerk";
import { getProgram } from "@/lib/data";

export async function POST(req: Request) {
  if (!stripeEnabled || !stripe) {
    return NextResponse.json(
      { error: "Stripe non configuré. Ajoute STRIPE_SECRET_KEY dans les variables d'environnement." },
      { status: 503 },
    );
  }

  const { programSlug } = (await req.json()) as { programSlug?: string };
  if (!programSlug) return NextResponse.json({ error: "programSlug requis" }, { status: 400 });

  const program = getProgram(programSlug);
  if (!program) return NextResponse.json({ error: "Programme introuvable" }, { status: 404 });

  let userId: string | null = null;
  let email: string | undefined;
  if (clerkEnabled) {
    const session = await auth();
    userId = session.userId;
    if (!userId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: program.priceCents,
          recurring: { interval: "month" },
          product_data: {
            name: program.title,
            description: program.description.slice(0, 200),
          },
        },
      },
    ],
    customer_email: email,
    metadata: { programSlug: program.slug, userId: userId ?? "guest" },
    success_url: `${origin}/dashboard?success=1&program=${program.slug}`,
    cancel_url: `${origin}/program/${program.slug}?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
