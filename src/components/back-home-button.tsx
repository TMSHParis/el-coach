"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

// Nombre de pages de l'app vues dans cet onglet (sessionStorage = par onglet).
// window.history.length seul ne suffit pas : un onglet ouvert depuis un autre
// site a un historique > 1 alors que la page précédente n'est pas dans l'app.
const NAV_COUNT_KEY = "elc_nav_count";

/** Monté une fois dans le layout racine — compte les changements de page de l'app. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const n = Number(sessionStorage.getItem(NAV_COUNT_KEY) ?? "0");
      sessionStorage.setItem(NAV_COUNT_KEY, String(n + 1));
    } catch {
      // sessionStorage indisponible (navigation privée stricte) — repli sur l'accueil.
    }
  }, [pathname]);
  return null;
}

/**
 * Retour intelligent : page précédente de l'app s'il y en a une, sinon
 * `fallbackHref` (accueil par défaut — accès direct, lien externe, nouvel onglet).
 */
export function useSmartBack(fallbackHref = "/") {
  const router = useRouter();
  return () => {
    let inAppHistory = false;
    try {
      inAppHistory = Number(sessionStorage.getItem(NAV_COUNT_KEY) ?? "0") > 1;
    } catch {}
    if (inAppHistory && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };
}

/**
 * Bouton « ← Accueil » des pages secondaires (partie 5, mission 3) : ouvre directement la page d'accueil,
 * quel que soit le chemin pris pour arriver (pas de retour à l'écran précédent, pas d'empilement).
 * Les sous-écrans gardent leur propre « ← Retour » (variant="back" : page précédente de l'app, sinon `href`).
 * Styles en `var(--bd)` / `var(--m)` : ces custom properties sont définies par le module CSS de la page hôte.
 */
export function BackHomeButton({
  href = "/",
  label,
  variant = "home",
  className,
  style,
}: {
  /** Destination (accueil par défaut ; repli du mode « back »). */
  href?: string;
  label?: string;
  variant?: "home" | "back";
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const t = useT();
  const smartBack = useSmartBack(href);
  const text = label ?? (variant === "home" ? t("nav.home") : t("nav.back"));
  return (
    <button
      type="button"
      onClick={() => (variant === "home" ? router.push(href) : smartBack())}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 44,
        background: "var(--t-card, none)",
        border: "1px solid var(--bd, var(--t-border, #2a2a2a))",
        borderRadius: 8,
        padding: "8px 14px",
        color: "var(--m, var(--t-muted, #8a8a8a))",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 1,
        cursor: "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {text}
    </button>
  );
}
