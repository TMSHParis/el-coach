"use client";

import { useState } from "react";
import styles from "./dashboard.module.css";
import { VideoModal } from "./session/video-modal";

export function SessionItemRow({
  name,
  qty,
  detail,
  movementName,
  videoUrl,
  noVideo,
}: {
  name: string;
  qty: string;
  detail?: string;
  movementName: string;
  videoUrl?: string;
  noVideo?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.item}>
      <div className={styles.idot} />
      <div className={styles.iname}>
        {name}
        {detail && <em>{detail}</em>}
      </div>
      <div className={styles.idetail}>{qty}</div>
      {!noVideo && (
        <>
          <button
            type="button"
            className={styles.ytBtn}
            onClick={() => setOpen(true)}
            aria-label={`Vidéo ${movementName}`}
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
