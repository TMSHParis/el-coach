"use client";

import { useState } from "react";
import type { DisplayBlock } from "@/lib/session-format";
import styles from "./dashboard.module.css";
import { SessionItemRow } from "./session-item-row";

/**
 * Séance d'un jour hors ECM (sport libre) ou de repos — mêmes blocs que les
 * séances ECM (SessionPanel), sans onglets A/B ni difficulté : il n'y a qu'une
 * version de la séance et aucun volume à alléger.
 */
export function AdviceSessionPanel({ nom, duree, blocs }: { nom: string; duree: string; blocs: DisplayBlock[] }) {
  // Accordéon : seul le 1er bloc est ouvert par défaut (doc H.3).
  const [openBlocks, setOpenBlocks] = useState<Set<number>>(() => new Set([0]));
  const toggleBlock = (i: number) =>
    setOpenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className={styles.sessA}>
      <div className={styles.sessHeader}>
        <div className={styles.sessName}>{nom}</div>
      </div>
      <div className={styles.sessBody}>
        {blocs.map((b, i) => {
          const isOpen = openBlocks.has(i);
          return (
            <div key={b.lettre} className={styles.block}>
              <div className={styles.blockTop} onClick={() => toggleBlock(i)} role="button" tabIndex={0}>
                <div className={styles.bletter}>{b.lettre}</div>
                <div className={styles.btitle}>{b.titre}</div>
                <div className={`${styles.bbadge} ${styles.badgeNft}`}>{b.badge}</div>
                <div className={styles.bchevron}>{isOpen ? "▲" : "▼"}</div>
              </div>
              {isOpen && (
                <div className={styles.items}>
                  {b.items.map((it, j) => (
                    <SessionItemRow
                      key={`${it.name}-${j}`}
                      name={it.name}
                      qty={it.qty}
                      detail={it.detail}
                      movementName={it.movementName}
                      videoUrl={it.videoUrl}
                      noVideo={it.noVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.sessFooter}>
        <div>
          <div className={styles.sessDurLabel}>Durée estimée</div>
          <div className={styles.sessDur}>{duree}</div>
        </div>
      </div>
    </div>
  );
}
