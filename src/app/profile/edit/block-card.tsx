"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cx } from "@/app/signup/ecm-shared";
import { themeLabel } from "@/lib/training-themes";
import { getThemeScreenData, type ThemeScreenData } from "../theme-actions";
import styles from "@/app/signup/ecm-signup.module.css";

/** Carte « BLOC EN COURS » du profil, section Programme (2.1). */
export function BlockCard() {
  const [data, setData] = useState<ThemeScreenData | null>(null);
  useEffect(() => {
    void getThemeScreenData().then(setData);
  }, []);
  if (!data) return null;
  const { current } = data;
  return (
    <div className={cx(styles.qc, styles.on)}>
      <div className={styles.ql}>
        BLOC EN COURS : {themeLabel(data.slug, current.theme).toUpperCase()}
        <span style={{ marginLeft: "auto", fontSize: 12 }}>
          Semaine {current.week} sur {current.weeks}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, margin: "8px 0" }}>
        {Array.from({ length: current.weeks }, (_, i) => {
          const n = i + 1;
          const last = n === current.weeks;
          return (
            <div
              key={n}
              style={{ flex: 1, height: 8, borderRadius: 4, background: last ? "#555" : n <= current.week ? "var(--accent, #C9A84C)" : "#222" }}
            />
          );
        })}
      </div>
      <div className={styles.weekHint}>
        Semaines 1 à {current.weeks - 1} de progression, semaine {current.weeks} de décharge
      </div>
      {current.finished && <div className={styles.weekHint}>Bloc terminé : choisis le bloc suivant.</div>}
      <Link href="/profile/theme" className={styles.weekResetLink}>
        {current.finished ? "Choisir le bloc suivant" : "Changer de thème"}
      </Link>
    </div>
  );
}
