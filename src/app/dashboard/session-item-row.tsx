"use client";

import { useState } from "react";
import styles from "./dashboard.module.css";
import { VideoModal } from "./session/video-modal";
import { useT, useLang } from "@/lib/i18n/provider";
import { tc } from "@/lib/i18n/content";

export function SessionItemRow({
  name,
  qty,
  detail,
  movementName,
  videoUrl,
  noVideo,
  hideVideo,
}: {
  name: string;
  qty: string;
  detail?: string;
  movementName: string;
  videoUrl?: string;
  noVideo?: boolean;
  /** La vidéo est affichée ailleurs (ligne d'actions « Remplacer »). */
  hideVideo?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.item}>
      <div className={styles.idot} />
      <div className={styles.iname}>
        {tc(lang, name)}
        {detail && <em>{tc(lang, detail)}</em>}
      </div>
      <div className={styles.idetail}>{tc(lang, qty)}</div>
      {!noVideo && !hideVideo && (
        <>
          <button
            type="button"
            className={styles.ytBtn}
            onClick={() => setOpen(true)}
            aria-label={t("dash.videoAria", { name: movementName })}
          >
            ▶
          </button>
          <VideoModal
            open={open}
            onClose={() => setOpen(false)}
            title={movementName}
            searchQuery={movementName}
            videoUrl={videoUrl}
          />
        </>
      )}
    </div>
  );
}
