"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

/**
 * Remplace l'ancien <details>/<summary> (doc H.3) : ouvrir l'aperçu à
 * l'intérieur de la même ligne flex que le bouton "Démarrer" le faisait
 * s'étirer sur toute la hauteur de l'aperçu (stretch par défaut), écrasant
 * son texte dans une bande verticale. Ici, l'aperçu ouvert remplace
 * entièrement la ligne CTA — "Démarrer" ne revient qu'à la fermeture.
 */
export function SessionPreviewToggle({
  startHref,
  titleLine,
  preview,
}: {
  startHref: string;
  titleLine: string;
  preview: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className={styles.previewPanelFull}>
        <div className={styles.previewPanelHead}>
          <button type="button" className={styles.previewCloseBtn} onClick={() => setOpen(false)}>
            ✕ Fermer
          </button>
          <div className={styles.previewPanelTitle}>{titleLine}</div>
          <div className={styles.previewReadonlyBadge}>Lecture seule</div>
        </div>
        {preview}
      </div>
    );
  }

  return (
    <div className={styles.upcomingCtaRow}>
      <button type="button" className={styles.upcomingPreviewBtn} onClick={() => setOpen(true)}>
        👁 APERÇU
      </button>
      <Link href={startHref} className={styles.upcomingStartBtn}>
        DÉMARRER →
      </Link>
    </div>
  );
}
