"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import styles from "./mindset.module.css";

export type MindsetState = "vert" | "jaune" | "rouge" | "repos";

const BADGE_KEYS = {
  vert: "ci.mindset.vert",
  jaune: "ci.mindset.jaune",
  rouge: "ci.mindset.rouge",
  repos: "ci.mindset.repos",
} as const;

/** Pas de redirection automatique : l'athlète passe au dashboard quand il a fini de lire. */
export function MindsetView({ message, state }: { message: string; state: MindsetState }) {
  const router = useRouter();
  const t = useT();

  return (
    <div className={styles.root}>
      <div className={`${styles.card} ${styles[state]}`}>
        <div className={styles.badgeRow}>
          <span className={styles.dot} />
          <span className={styles.badge}>{t(BADGE_KEYS[state])}</span>
        </div>
        <p className={styles.message}>{message}</p>
        <button type="button" className={styles.go} onClick={() => router.replace("/dashboard")}>
          {t("ci.mindset.go")}
        </button>
      </div>
    </div>
  );
}
