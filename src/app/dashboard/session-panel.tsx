import type { DisplayBlock } from "@/lib/session-format";
import styles from "./dashboard.module.css";
import { SessionItemRow } from "./session-item-row";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const TAG_CLS: Record<string, string> = {
  tagBlue: styles.tagBlue,
  tagGreen: styles.tagGreen,
  tagOrange: styles.tagOrange,
  tagRed: styles.tagRed,
  tagPurple: styles.tagPurple,
};

const BADGE_CLS: Record<string, string> = {
  badgeNft: styles.badgeNft,
  badgeBth: styles.badgeBth,
  badgeFt: styles.badgeFt,
  badgeAmrap: styles.badgeAmrap,
  badgeEmom: styles.badgeEmom,
  badgeTabata: styles.badgeTabata,
};

export function SessionPanel({
  variant,
  nom,
  duree,
  difficulte,
  tags,
  blocs,
}: {
  variant: "a" | "b";
  nom: string;
  duree: string;
  difficulte: number;
  tags: { label: string; cls: keyof typeof TAG_CLS }[];
  blocs: DisplayBlock[];
}) {
  return (
    <div className={variant === "a" ? styles.sessA : styles.sessB}>
      <div className={styles.sessHeader}>
        <div className={styles.sessName}>{nom}</div>
        <div className={styles.sessTags}>
          {tags.map((t) => (
            <span key={t.label} className={cx(styles.tag, TAG_CLS[t.cls])}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.sessBody}>
        {blocs.map((b, i) => (
          <div key={`${b.titre}-${i}`} className={styles.block}>
            <div className={styles.blockTop}>
              <div className={styles.bletter}>{b.lettre}</div>
              <div className={styles.btitle}>{b.titre}</div>
              <div className={cx(styles.bbadge, BADGE_CLS[`badge${capitalize(b.badgeCls)}`])}>{b.badge}</div>
            </div>
            <div className={styles.items}>
              {b.items.map((it, j) => (
                <SessionItemRow
                  key={`${it.movementName}-${j}`}
                  name={it.name}
                  qty={it.qty}
                  detail={it.detail}
                  movementName={it.movementName}
                  videoUrl={it.videoUrl}
                />
              ))}
            </div>
            {b.note && <div className={styles.bnote}>{b.note}</div>}
          </div>
        ))}
      </div>
      <div className={styles.sessFooter}>
        <div>
          <div className={styles.sessDurLabel}>Durée estimée</div>
          <div className={styles.sessDur}>{duree}</div>
        </div>
        <div className={styles.diffWrap}>
          <div className={styles.diffLabel}>Difficulté</div>
          <div className={styles.diffDots}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={cx(styles.ddot, i < difficulte && (variant === "a" ? styles.a : styles.b))} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
