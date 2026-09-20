import type { DisplayBlock } from "@/lib/session-format";
import styles from "./dashboard.module.css";
import { SessionItemRow } from "./session-item-row";

/**
 * Séance d'un jour hors ECM (sport libre) ou de repos — mêmes blocs que les
 * séances ECM (SessionPanel), sans onglets A/B ni difficulté : il n'y a qu'une
 * version de la séance et aucun volume à alléger.
 */
export function AdviceSessionPanel({ nom, duree, blocs }: { nom: string; duree: string; blocs: DisplayBlock[] }) {
  return (
    <div className={styles.sessA}>
      <div className={styles.sessHeader}>
        <div className={styles.sessName}>{nom}</div>
      </div>
      <div className={styles.sessBody}>
        {blocs.map((b) => (
          <div key={b.lettre} className={styles.block}>
            <div className={styles.blockTop}>
              <div className={styles.bletter}>{b.lettre}</div>
              <div className={styles.btitle}>{b.titre}</div>
              <div className={`${styles.bbadge} ${styles.badgeNft}`}>{b.badge}</div>
            </div>
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
          </div>
        ))}
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
