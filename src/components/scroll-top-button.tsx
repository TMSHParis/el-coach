"use client";

// Bouton « Remonter en haut » (partie 5, mission 2). Un seul composant, monté dans le layout racine :
// même rendu partout. Apparaît après SHOW_AFTER px de défilement, se pose 16 px au-dessus de la barre fixe
// du bas (éléments marqués `data-bottom-bar`), se masque quand une feuille / un chrono plein écran
// (`data-hide-scroll-top`, `<dialog open>`) ou le clavier est ouvert.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import styles from "./scroll-top-button.module.css";

/** Paramètres de départ (modifiables). */
const SHOW_AFTER = 300;
const GAP_ABOVE_BAR = 16;
const KEYBOARD_MIN_SHRINK = 120;

export function ScrollTopButton() {
  const t = useT();
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const [bottom, setBottom] = useState<string>("calc(24px + env(safe-area-inset-bottom))");
  const btnRef = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);

  const measure = useCallback(() => {
    // Barre fixe la plus haute en bas de l'écran.
    let barTop = window.innerHeight;
    document.querySelectorAll<HTMLElement>("[data-bottom-bar]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < barTop && r.bottom > window.innerHeight - 4) barTop = r.top;
    });
    const above = window.innerHeight - barTop;
    setBottom(above > 0 ? `${Math.round(above + GAP_ABOVE_BAR)}px` : "calc(24px + env(safe-area-inset-bottom))");

    const scrollable = document.documentElement.scrollHeight - window.innerHeight > SHOW_AFTER;
    const overlay = !!document.querySelector("[data-hide-scroll-top], dialog[open]");
    const vv = window.visualViewport;
    const keyboard = !!vv && window.innerHeight - vv.height > KEYBOARD_MIN_SHRINK;
    const typing = document.activeElement instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && keyboard;
    setShown(scrollable && window.scrollY > SHOW_AFTER && !overlay && !keyboard && !typing);
  }, []);

  useEffect(() => {
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-hide-scroll-top", "open", "data-bottom-bar"] });
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      mo.disconnect();
    };
  }, [measure, pathname]);

  // Couleur d'accent de l'écran : variable --accent (dashboard, check-in) ou --g (écran de séance) du conteneur de la page.
  useEffect(() => {
    let found: string | undefined;
    const els = document.querySelectorAll("main > *, main > * > *, main > * > * > *");
    for (const el of Array.from(els).slice(0, 12)) {
      const cs = getComputedStyle(el);
      const v = cs.getPropertyValue("--accent").trim() || cs.getPropertyValue("--g").trim();
      if (v) {
        found = v;
        break;
      }
    }
    if (found) btnRef.current?.style.setProperty("--scroll-top-accent", found);
    else btnRef.current?.style.removeProperty("--scroll-top-accent");
  }, [pathname]);

  return (
    <button
      type="button"
      aria-label={t("nav.scrollTop")}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      className={`${styles.btn} ${shown ? styles.shown : ""}`}
      ref={btnRef}
      style={{ bottom }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden>↑</span>
    </button>
  );
}
