import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// /dashboard, /checkin et /profile/edit exposent des données perso persistées
// en base (profil, historique) — désormais rattachées à un vrai compte Clerk
// créé par le signup ECM (AccountStepClerk dans ecm-signup-form.tsx), donc on
// peut les protéger sans casser ce flux. Le reste du site (marketing, /signin,
// /signup lui-même) reste public.
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/checkin(.*)",
  "/profile/edit(.*)",
  "/settings(.*)",
  "/progress(.*)",
  "/history(.*)",
  "/account(.*)",
  "/mindset(.*)",
]);

// Redirection maison vers /signin?redirect=<page demandée> (page ECM, pas la
// page Clerk hébergée /sign-in) — cf. note "Signup & Connexion" du produit.
//
// Abonnement : aucune vérification ici pour l'instant, être connecté suffit.
// Quand Stripe sera branché (P3), le contrôle d'abonnement se pose dans
// `hasFullAccess()` (src/lib/access.ts) et **nulle part ailleurs** — cette
// fonction court-circuite déjà les comptes admin (publicMetadata.role ===
// "admin", posé à la main dans Clerk). Un compte admin ne doit jamais être
// renvoyé vers /checkout ni voir un message d'essai ou d'expiration.
const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isProtected(req)) return;
  const { userId } = await auth();
  if (userId) return;
  const url = new URL("/signin", req.url);
  url.searchParams.set("redirect", req.nextUrl.pathname);
  return NextResponse.redirect(url);
});

export default function middleware(req: NextRequest) {
  if (!clerkEnabled) return NextResponse.next();
  // @ts-expect-error — delegate to Clerk middleware
  return clerkHandler(req);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp3)).*)",
    "/(api|trpc)(.*)",
  ],
};
