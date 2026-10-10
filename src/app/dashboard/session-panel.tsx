"use client";

import { useState } from "react";
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
        {blocs.map((b, i) => {
          const isOpen = openBlocks.has(i);
          return (
            <div key={`${b.titre}-${i}`} className={styles.block}>
              <div className={styles.blockTop} onClick={() => toggleBlock(i)} role="button" tabIndex={0}>
                <div className={styles.bletter}>{b.lettre}</div>
                <div className={styles.btitle}>{b.titre}</div>
                <div className={cx(styles.bbadge, BADGE_CLS[`badge${capitalize(b.badgeCls)}`])}>{b.badge}</div>
                <div className={styles.bchevron}>{isOpen ? "▲" : "▼"}</div>
              </div>
              {isOpen && (
                <>
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
                </>
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
