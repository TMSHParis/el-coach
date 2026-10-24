"use client";

// Blocs de récupération en consultation (partie 4, mission 4) : aucun ✓, aucune case, aucun chrono.
// Chaque mouvement garde son bouton vidéo.

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import type { Translate } from "@/lib/i18n";
import type { DisplayBlock } from "@/lib/session-format";
import { VideoModal } from "../dashboard/session/video-modal";
import styles from "./recovery.module.css";

const ICONS = ["🚶", "⚠️", "🧠"];

function countLabel(b: DisplayBlock, index: number, t: Translate): string {
  const videoItems = b.items.filter((i) => !i.noVideo).length;
  if (videoItems > 0) return t(videoItems > 1 ? "sp.rb.moves.many" : "sp.rb.moves.one", { n: videoItems });
  return index === 2 || /mindset/i.test(b.titre) ? t("sp.rb.mental") : t("sp.rb.tips");
}

function MovementRow({ name, qty, detail, videoUrl }: { name: string; qty: string; detail?: string; videoUrl?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <div className={styles.rowName}>{name}</div>
        {detail && <div className={styles.rowDetail}>{detail}</div>}
      </div>
      {qty && <div className={styles.rowQty}>{qty}</div>}
      <button type="button" className={styles.play} onClick={() => setOpen(true)} aria-label={t("sp.rb.video", { name })}>
        ▶
      </button>
      <VideoModal open={open} onClose={() => setOpen(false)} title={name} searchQuery={name} videoUrl={videoUrl} />
    </div>
  );
}

export function RecoveryBlocks({ blocks }: { blocks: DisplayBlock[] }) {
  const t = useT();
  const [openIdx, setOpenIdx] = useState<Set<number>>(new Set([0]));
  const toggle = (i: number) =>
    setOpenIdx((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className={styles.list}>
      {blocks.map((b, i) => {
        const open = openIdx.has(i);
        return (
          <div key={`${b.titre}-${i}`} className={styles.card}>
            <button type="button" className={styles.head} onClick={() => toggle(i)} aria-expanded={open}>
              <span className={styles.icon}>{ICONS[i] ?? "•"}</span>
              <span className={styles.name}>{b.titre}</span>
              <span className={styles.count}>{countLabel(b, i, t)}</span>
              <span className={`${styles.chev} ${open ? styles.chevOpen : ""}`}>▾</span>
            </button>
            {open && (
              <div className={styles.body}>
                {b.items.map((it, j) =>
                  it.noVideo ? (
                    <div key={j} className={styles.tip}>
                      {it.name}
                    </div>
                  ) : (
                    <MovementRow key={j} name={it.name} qty={it.qty} detail={it.detail} videoUrl={it.videoUrl} />
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
