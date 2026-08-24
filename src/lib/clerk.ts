// CLERK_SECRET_KEY n'est jamais présent dans le bundle client (variable
// serveur-only) — ne fiabiliser `clerkEnabled` que côté serveur.
export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// Pour un composant client ("use client") : la clé publique suffit, elle est
// inlinée au build. Reflète toujours la même config puisque les deux clés
// sont provisionnées ensemble (Vercel Marketplace).
export const clerkEnabledClient = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
