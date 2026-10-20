"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/app/signup/ecm-shared";
import { COACH_PARAMS } from "@/lib/coach-params";
import { MAX_WEAK_POINTS, VOLUME_BLOCK_MARKS, WEAK_POINT_OPTIONS, themeLabel } from "@/lib/training-themes";
import { getThemeScreenData, startTrainingBlock, type ThemeScreenData } from "../theme-actions";
import styles from "@/app/signup/ecm-signup.module.css";

/** « CHOISIS TON THÈME » / « CHOISIS TA FILIÈRE » (Volume Block) — écrans 2.2 et 2.9. */
export function ThemeScreen() {
  const router = useRouter();
  const [data, setData] = useState<ThemeScreenData | null>(null);
  const [theme, setTheme] = useState("");
  const [weeks, setWeeks] = useState<number>(COACH_PARAMS.blockWeeksDefault);
  const [weak, setWeak] = useState<string[]>([]);
  const [step, setStep] = useState<"theme" | "weak">("theme");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getThemeScreenData().then((d) => {
      setData(d);
      if (d) {
        setTheme(d.suggested && d.current.theme === d.suggested ? d.current.theme : d.suggested ?? d.current.theme);
        setWeeks(d.current.weeks);
        setWeak(d.current.weakPoints);
      }
    });
  }, []);

  if (!data) return <p style={{ padding: 24 }}>Chargement…</p>;
  const volumeBlock = data.slug === "volume-block-hypertrophy";

  async function validate(weakPoints: string[]) {
    if (!data) return;
    setBusy(true);
    const res = await startTrainingBlock({ slug: data.slug, theme, weeks, weakPoints });
    setBusy(false);
    if (res.ok) router.push("/profile/edit");
  }

  if (step === "weak") {
    return (
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ letterSpacing: 2 }}>QUE VEUX-TU TRAVAILLER ?</h2>
        <div className={styles.opts}>
          {WEAK_POINT_OPTIONS.map((o) => {
            const on = weak.includes(o.movementId);
            return (
              <button
                key={o.movementId}
                type="button"
                className={cx(styles.opt, on && styles.sel)}
                onClick={() =>
                  setWeak((w) => (on ? w.filter((x) => x !== o.movementId) : w.length < MAX_WEAK_POINTS ? [...w, o.movementId] : w))
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <div className={styles.weekHint}>
          {weak.length} sélectionné{weak.length > 1 ? "s" : ""} sur {MAX_WEAK_POINTS} maximum
        </div>
        <button type="button" className={styles.btnAddSport} disabled={busy || weak.length === 0} onClick={() => validate(weak)}>
          VALIDER
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 2.1 — carte « Bloc en cours » */}
      <div className={cx(styles.qc, styles.on)}>
        <div className={styles.ql}>
          BLOC EN COURS : {themeLabel(data.slug, data.current.theme).toUpperCase()}
          <span style={{ marginLeft: "auto", fontSize: 12 }}>
            Semaine {data.current.week} sur {data.current.weeks}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, margin: "8px 0" }}>
          {Array.from({ length: data.current.weeks }, (_, i) => {
            const n = i + 1;
            const last = n === data.current.weeks;
            return (
              <div
                key={n}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: last ? "#555" : n <= data.current.week ? "var(--accent, #C9A84C)" : "#222",
                  opacity: last ? 0.7 : 1,
                }}
              />
            );
          })}
        </div>
        <div className={styles.weekHint}>
          Semaines 1 à {data.current.weeks - 1} de progression, semaine {data.current.weeks} de décharge
        </div>
        {data.current.finished && (
          <div style={{ marginTop: 8 }}>
            <strong>BLOC TERMINÉ : {themeLabel(data.slug, data.current.theme).toUpperCase()}</strong>
            <div className={styles.weekHint}>
              {data.current.weeks - 1} semaines de progression, 1 semaine de décharge. Que veux-tu travailler ensuite ?
            </div>
          </div>
        )}
      </div>

      <h2 style={{ letterSpacing: 2 }}>{volumeBlock ? "CHOISIS TA FILIÈRE" : "CHOISIS TON THÈME"}</h2>

      {volumeBlock && data.suggested && (
        <div className={styles.weekHint}>
          Thème conseillé : <strong>{themeLabel(data.slug, data.suggested).toUpperCase()}</strong>. Conseillé d&apos;après ton premier objectif
          {data.objectifLabel ? ` (${data.objectifLabel.toLowerCase()})` : ""}. Tu pourras le changer à tout moment.
        </div>
      )}

      {data.competition && (
        <div className={styles.weekHint}>
          Mode Compétition activé d&apos;après ta date de course : les thèmes Force et Endurance ne s&apos;appliquent plus.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.themes.map((t) => (
          <div
            key={t.id}
            className={cx(styles.mo, theme === t.id && styles.sel)}
            onClick={() => !t.auto && !data.competition && setTheme(t.id)}
            style={t.auto || data.competition ? { opacity: 0.6 } : undefined}
          >
            <div className={styles.mc}>{theme === t.id ? "✓" : ""}</div>
            <div>
              <div>
                <strong>{t.label}</strong>
                {t.isDefault && !volumeBlock && <em> · par défaut</em>}
                {volumeBlock && data.suggested === t.id && <em> · conseillé</em>}
              </div>
              <div className={styles.weekHint}>{t.description}</div>
              {volumeBlock && (
                <div className={styles.weekHint}>
                  {VOLUME_BLOCK_MARKS[t.id]?.map((m) => `${m.label} : ${m.value}`).join(" · ")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className={styles.dl}>Durée du bloc, décharge comprise</div>
        <div className={styles.opts}>
          {COACH_PARAMS.blockWeeksOptions.map((w) => (
            <button key={w} type="button" className={cx(styles.opt, weeks === w && styles.sel)} onClick={() => setWeeks(w)}>
              {w} semaines
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={styles.btnAddSport}
        disabled={busy}
        onClick={() => (theme === "points_faibles" ? setStep("weak") : validate([]))}
      >
        VALIDER
      </button>
      <div className={styles.weekHint}>
        Changer de thème en cours de bloc interrompt ta progression actuelle.
      </div>
    </div>
  );
}
