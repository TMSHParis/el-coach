"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

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
 * Bouton "← Retour" des pages "bare" (sans Nav du site) qui ont leur propre
 * topbar. Styles en `var(--bd)` / `var(--m)` : ces custom properties sont
 * définies par le module CSS de la page hôte (checkin.module.css /
 * dashboard.module.css) et héritent normalement jusqu'ici.
 */
export function BackHomeButton({
  href = "/",
  label = "← Retour",
  className,
  style,
}: {
  /** Destination si aucune page précédente dans l'app. */
  href?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const back = useSmartBack(href);
  return (
    <button
      type="button"
      onClick={back}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "none",
        border: "1px solid var(--bd, #2a2a2a)",
        borderRadius: 4,
        padding: "8px 12px",
        color: "var(--m, #8a8a8a)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 1,
        cursor: "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {label}
    </button>
  );
}
