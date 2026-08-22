import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// Clerk reste optionnel : l'app fonctionne sur son propre modèle
// cookie + Postgres (signup ECM → checkin → dashboard), qui ne crée jamais de
// session Clerk. On garde clerkMiddleware() actif pour que `auth()` /
// `currentUser()` marchent côté serveur (personnalisation, futur vrai compte),
// mais sans jamais bloquer une route — protéger /dashboard casserait le flux
// ECM pour tout le monde tant que le signup ne crée pas réellement un compte Clerk.
const clerkHandler = clerkMiddleware();

export default function middleware(req: NextRequest) {
  if (!clerkEnabled) return NextResponse.next();
  // @ts-expect-error — delegate to Clerk middleware
  return clerkHandler(req);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
