"use client";

import { usePathname } from "next/navigation";

// Masque le Nav/Footer globaux sur les routes plein écran (ex: /signup, /checkin,
// /session — designs autonomes avec leur propre header/logo).
const BARE_PREFIX_ROUTES = ["/signup", "/checkin", "/session"];
// /dashboard seul (pas /dashboard/session, qui garde le chrome du site).
const BARE_EXACT_ROUTES = ["/dashboard"];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare =
    BARE_EXACT_ROUTES.includes(pathname) ||
    BARE_PREFIX_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isBare) return null;
  return <>{children}</>;
}
