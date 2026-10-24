"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COACH_PARAMS } from "@/lib/coach-params";
import { COMPETITION_BLOCKED_THEMES } from "@/lib/competition-params";
import { MAX_WEAK_POINTS, VOLUME_BLOCK_MARKS, WEAK_POINT_OPTIONS, themeLabel } from "@/lib/training-themes";
import { getThemeScreenData, startTrainingBlock, type ThemeScreenData } from "../theme-actions";
import { useT } from "@/lib/i18n/provider";
import { dv } from "@/app/signup/display";
import styles from "./theme-screen.module.css";

const WEEK_OPTIONS = COACH_PARAMS.blockWeeksOptions as readonly number[];

/** Barre de N semaines de même largeur : faites en accent, à venir en gris foncé, décharge en gris plus clair. */
function WeekBar({ weeks, done }: { weeks: number; done: number }) {
  return (
    <div className={styles.bar}>
      {Array.from({ length: weeks }, (_, i) => {
        const n = i + 1;
        const last = n === weeks;
        return <div key={n} className={`${styles.seg} ${last ? styles.segDeload : n <= done ? styles.segDone : ""}`} />;
      })}
    </div>
  );
}

/** « Mon bloc d'entraînement » : choix du thème et de la durée du bloc (mission 6) et écran de fin de bloc (mission 5, 8). */
export function ThemeScreen() {
  const router = useRouter();
  const t = useT();
  const [data, setData] = useState<ThemeScreenData | null>(null);
  const [theme, setTheme] = useState("");
  const [weeks, setWeeks] = useState<number>(COACH_PARAMS.blockWeeksDefault);
  const [weak, setWeak] = useState<string[]>([]);
  const [step, setStep] = useState<"theme" | "weak">("theme");
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"save" | "pick" | null>(null);

  useEffect(() => {
    void getThemeScreenData().then((d) => {
      setData(d);
      if (d) {
        // Bloc terminé : le thème conseillé suivant est présélectionné ; sinon le thème du bloc en cours.
        setTheme(d.current.finished && d.suggested ? d.suggested : d.current.theme);
        setWeeks(d.current.finished ? COACH_PARAMS.blockWeeksDefault : d.current.weeks);
        setWeak(d.current.weakPoints);
      }
    });
  }, []);

  if (!data) return <p style={{ padding: 24 }}>{t("su.theme.loading")}</p>;
  const volumeBlock = data.slug === "volume-block-hypertrophy";
  const blocked = (id: string) => data.competition && COMPETITION_BLOCKED_THEMES.some((b) => b.toLowerCase().replace("é", "e") === id);
  const tl = (id: string) => dv(t, themeLabel(data.slug, id));

  async function validate(weakPoints: string[]) {
    if (!data) return;
    setBusy(true);
    const res = await startTrainingBlock({ slug: data.slug, theme, weeks, weakPoints });
    setBusy(false);
    if (res.ok) router.push("/profile/edit");
    else setError("save");
  }

  const back = (
    <button type="button" className={styles.back} onClick={() => (step === "weak" ? setStep("theme") : router.push("/profile/edit"))}>
      {t("su.back")}
    </button>
  );

  if (step === "weak") {
    return (
      <div className={styles.root}>
        {back}
        <div className={styles.weakTitle}>{t("su.theme.weakTitle")}</div>
        <div className={styles.pills}>
          {WEAK_POINT_OPTIONS.map((o) => {
            const on = weak.includes(o.movementId);
            return (
              <button
                key={o.movementId}
                type="button"
                className={on ? styles.wpOn : styles.wp}
                aria-pressed={on}
                onClick={() => setWeak((w) => (on ? w.filter((x) => x !== o.movementId) : w.length < MAX_WEAK_POINTS ? [...w, o.movementId] : w))}
              >
                {o.movementId === "run" ? t("su.wp.run") : dv(t, o.label)}
              </button>
            );
          })}
        </div>
        <div className={styles.counter}>
          {t(weak.length > 1 ? "su.theme.selectedMany" : "su.theme.selectedOne", { n: weak.length, max: MAX_WEAK_POINTS })}
        </div>
        {error && <div className={styles.error}>{error === "save" ? t("su.theme.saveFail") : t("su.theme.pickOne")}</div>}
        <div data-bottom-bar className={styles.footer}>
          <button
            type="button"
            className={styles.validate}
            disabled={busy}
            onClick={() => (weak.length === 0 ? setError("pick") : validate(weak))}
          >
            <span className={styles.validateLabel}>{t("su.validate")}</span>
            <span className={styles.validateSub}>{t("su.theme.sub", { theme: tl(theme), weeks })}</span>
          </button>
        </div>
      </div>
    );
  }

  // Bloc terminé : écran de fin de bloc avant le choix du thème (le bouton ouvre l'écran de choix).
  if (data.current.finished && !choosing) {
    const label = tl(data.current.theme).toUpperCase();
    const next = data.suggested ? tl(data.suggested) : null;
    return (
      <div className={styles.root}>
        {back}
        <h1 className={styles.title}>{t("su.theme.pageTitle")}</h1>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.cardTitle}>{t("su.theme.finishedTitle", { label })}</span>
            <span className={styles.cardWeek}>{t("su.theme.nWeeks", { n: data.current.weeks })}</span>
          </div>
          <WeekBar weeks={data.current.weeks} done={data.current.weeks - 1} />
          <div className={styles.endText}>
            {t("su.theme.endText", { n: data.current.weeks - 1 })}
            {next ? ` ${t("su.theme.suggestedTheme", { theme: next })}` : ""}
          </div>
          <button type="button" className={styles.cta} onClick={() => setChoosing(true)}>
            {t("su.theme.chooseNext")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {back}
      {/* Carte « Bloc en cours » */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardTitle}>{t("su.block.current", { theme: tl(data.current.theme).toUpperCase() })}</span>
          <span className={styles.cardWeek}>
            {t("su.theme.weekOfCaps", { n: data.current.week, total: data.current.weeks })}
          </span>
        </div>
        <WeekBar weeks={data.current.weeks} done={data.current.week} />
        <div className={styles.legend}>
          {t("su.block.legend", { n: data.current.weeks - 1, total: data.current.weeks })}
        </div>
      </div>

      <h1 className={styles.title}>{t("su.theme.pageTitle")}</h1>

      <div className={styles.section} style={{ marginTop: 0 }}>
        {t("su.theme.chooseTheme")}
      </div>
      {data.competition && (
        <p className={styles.notice}>
          {t("su.theme.compNotice")}
        </p>
      )}
      <div className={styles.list}>
        {data.themes.map((th) => {
          const off = !!th.auto || blocked(th.id);
          const on = theme === th.id;
          return (
            <div
              key={th.id}
              role="radio"
              aria-checked={on}
              aria-disabled={off}
              tabIndex={0}
              className={`${on ? styles.optOn : styles.opt} ${off ? styles.optOff : ""}`}
              onClick={() => !off && setTheme(th.id)}
              onKeyDown={(e) => {
                if (!off && (e.key === "Enter" || e.key === " ")) setTheme(th.id);
              }}
            >
              <span className={on ? styles.radioOn : styles.radio} />
              <span className={styles.optBody}>
                <span className={styles.optName}>
                  {dv(t, th.label)}
                  {th.isDefault && !volumeBlock && <span className={styles.pill}>{t("su.theme.default")}</span>}
                  {data.suggested === th.id && <span className={styles.pill}>{t("su.theme.suggested")}</span>}
                </span>
                <span className={styles.optDesc} style={{ display: "block" }}>
                  {dv(t, th.description)}
                </span>
                {volumeBlock && VOLUME_BLOCK_MARKS[th.id] && (
                  <span className={styles.marks} style={{ display: "block" }}>
                    {VOLUME_BLOCK_MARKS[th.id].map((m) => `${dv(t, m.label)} ${dv(t, m.value)}`).join(" · ")}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.section}>
        {t("su.theme.duration")}<span className={styles.sectionNote}>{t("su.theme.deloadIncl")}</span>
      </div>
      <div className={styles.seg3} role="radiogroup" aria-label={t("su.theme.duration")}>
        {WEEK_OPTIONS.map((w) => (
          <button key={w} type="button" role="radio" aria-checked={weeks === w} className={weeks === w ? styles.seg3On : styles.seg3Btn} onClick={() => setWeeks(w)}>
            {t("su.theme.nWeeks", { n: w })}
          </button>
        ))}
      </div>

      <div className={styles.warn}>
        <span className={styles.warnIcon}>ⓘ</span>
        <span>{t("su.theme.warn")}</span>
      </div>
      {error && <div className={styles.error}>{error === "save" ? t("su.theme.saveFail") : t("su.theme.pickOne")}</div>}

      <div data-bottom-bar className={styles.footer}>
        <button
          type="button"
          className={styles.validate}
          disabled={busy}
          onClick={() => (theme === "points_faibles" ? setStep("weak") : validate([]))}
        >
          <span className={styles.validateLabel}>{t("su.validate")}</span>
          <span className={styles.validateSub}>{t("su.theme.sub", { theme: tl(theme), weeks })}</span>
        </button>
      </div>
    </div>
  );
}
