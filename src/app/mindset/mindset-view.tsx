"use client";

import { useRouter } from "next/navigation";
import styles from "./mindset.module.css";

export type MindsetState = "vert" | "jaune" | "rouge" | "repos";

const BADGES: Record<MindsetState, string> = {
  vert: "[ SCORE ECM · VERT ]",
  jaune: "[ SCORE ECM · JAUNE ]",
  rouge: "[ SCORE ECM · ROUGE ]",
  repos: "[ REPOS ]",
};

/** Pas de redirection automatique : l'athlète passe au dashboard quand il a fini de lire. */
export function MindsetView({ message, state }: { message: string; state: MindsetState }) {
  const router = useRouter();

  return (
    <div className={styles.root}>
      <div className={`${styles.card} ${styles[state]}`}>
        <div className={styles.badgeRow}>
          <span className={styles.dot} />
          <span className={styles.badge}>{BADGES[state]}</span>
        </div>
        <p className={styles.message}>{message}</p>
        <button type="button" className={styles.go} onClick={() => router.replace("/dashboard")}>
          Allons-y →
        </button>
      </div>
    </div>
  );
}
