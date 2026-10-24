"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { ApercuPanel } from "./apercu-panel";
import { useT } from "@/lib/i18n/provider";

/**
 * Remplace l'ancien <details>/<summary> (doc H.3) : ouvrir l'aperçu à
 * l'intérieur de la même ligne flex que le bouton "Démarrer" le faisait
 * s'étirer sur toute la hauteur de l'aperçu (stretch par défaut), écrasant
 * son texte dans une bande verticale. Ici, l'aperçu ouvert remplace
 * entièrement la ligne CTA — "Démarrer" ne revient qu'à la fermeture.
 *
 * L'aperçu ouvert utilise le modèle unique ApercuPanel (doc H.13 Mission C) :
 * même en-tête/résumé/pied de page pour toute séance ECM, récupération,
 * sport hors ECM ou repos — `children` ne porte plus que les cartes.
 */
export function SessionPreviewToggle({
  startHref,
  programTitle,
  subtitle,
  summaryIcon,
  summaryTitle,
  summaryLine,
  durationLabel,
  children,
}: {
  startHref: string;
  programTitle: string;
  subtitle: string;
  summaryIcon: string;
  summaryTitle: string;
  summaryLine: string;
  durationLabel?: string;
  children: ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <ApercuPanel
        onClose={() => setOpen(false)}
        programTitle={programTitle}
        subtitle={subtitle}
        summaryIcon={summaryIcon}
        summaryTitle={summaryTitle}
        summaryLine={summaryLine}
        durationLabel={durationLabel}
      >
        {children}
      </ApercuPanel>
    );
  }

  return (
    <div className={styles.upcomingCtaRow}>
      <button type="button" className={styles.upcomingPreviewBtn} onClick={() => setOpen(true)}>
        {t("dash.preview.open")}
      </button>
      <Link href={startHref} className={styles.upcomingStartBtn}>
        {t("dash.preview.start")}
      </Link>
    </div>
  );
}
