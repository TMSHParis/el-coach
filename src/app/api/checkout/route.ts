import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { clerkEnabled } from "@/lib/clerk";
import { getProgram } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const { t } = await getT();
  if (!stripeEnabled || !stripe) {
    return NextResponse.json(
      { error: t("app.api.stripeNotConfigured") },
      { status: 503 },
    );
  }

  const { programSlug } = (await req.json()) as { programSlug?: string };
  if (!programSlug) return NextResponse.json({ error: t("app.api.programSlugRequired") }, { status: 400 });

  const program = getProgram(programSlug);
  if (!program) return NextResponse.json({ error: t("app.api.programNotFound") }, { status: 404 });

  let userId: string | null = null;
  let email: string | undefined;
  if (clerkEnabled) {
    const session = await auth();
    userId = session.userId;
    if (!userId) {
      return NextResponse.json({ error: t("app.api.authRequired") }, { status: 401 });
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
