"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cx } from "@/app/signup/ecm-shared";
import { themeLabel } from "@/lib/training-themes";
import { useT } from "@/lib/i18n/provider";
import { dv } from "@/app/signup/display";
import { getThemeScreenData, type ThemeScreenData } from "../theme-actions";
import styles from "@/app/signup/ecm-signup.module.css";

/** Carte « BLOC EN COURS » du profil, section Programme (2.1). */
export function BlockCard() {
  const t = useT();
  const [data, setData] = useState<ThemeScreenData | null>(null);
  useEffect(() => {
    void getThemeScreenData().then(setData);
  }, []);
  if (!data) return null;
  const { current } = data;
  return (
    <div className={cx(styles.qc, styles.on)}>
      <div className={styles.ql}>
        {t("su.block.current", { theme: dv(t, themeLabel(data.slug, current.theme)).toUpperCase() })}
        <span style={{ marginLeft: "auto", fontSize: 12 }}>
          {t("su.block.weekOf", { n: current.week, total: current.weeks })}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, margin: "8px 0" }}>
        {Array.from({ length: current.weeks }, (_, i) => {
          const n = i + 1;
          const last = n === current.weeks;
          return (
            <div
              key={n}
              style={{ flex: 1, height: 8, borderRadius: 4, background: last ? "var(--c-555555)" : n <= current.week ? "var(--accent, var(--c-c9a84c))" : "var(--c-222222)" }}
            />
          );
        })}
      </div>
      <div className={styles.weekHint}>
        {t("su.block.legend", { n: current.weeks - 1, total: current.weeks })}
      </div>
      {current.finished && <div className={styles.weekHint}>{t("su.block.finished")}</div>}
      <Link href="/profile/theme" className={styles.weekResetLink}>
        {current.finished ? t("su.block.chooseNext") : t("su.block.changeTheme")}
      </Link>
    </div>
  );
}
