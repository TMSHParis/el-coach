"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COACH_PARAMS } from "@/lib/coach-params";
import { COMPETITION_BLOCKED_THEMES } from "@/lib/competition-params";
import { MAX_WEAK_POINTS, VOLUME_BLOCK_MARKS, WEAK_POINT_OPTIONS, themeLabel } from "@/lib/training-themes";
import { getThemeScreenData, startTrainingBlock, type ThemeScreenData } from "../theme-actions";
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
  const [data, setData] = useState<ThemeScreenData | null>(null);
  const [theme, setTheme] = useState("");
  const [weeks, setWeeks] = useState<number>(COACH_PARAMS.blockWeeksDefault);
  const [weak, setWeak] = useState<string[]>([]);
  const [step, setStep] = useState<"theme" | "weak">("theme");
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!data) return <p style={{ padding: 24 }}>Chargement…</p>;
  const volumeBlock = data.slug === "volume-block-hypertrophy";
  const blocked = (id: string) => data.competition && COMPETITION_BLOCKED_THEMES.some((t) => t.toLowerCase().replace("é", "e") === id);

  async function validate(weakPoints: string[]) {
    if (!data) return;
    setBusy(true);
    const res = await startTrainingBlock({ slug: data.slug, theme, weeks, weakPoints });
    setBusy(false);
    if (res.ok) router.push("/profile/edit");
    else setError("Impossible d'enregistrer ce bloc.");
  }

  const back = (
    <button type="button" className={styles.back} onClick={() => (step === "weak" ? setStep("theme") : router.push("/profile/edit"))}>
      ← Retour
    </button>
  );

  if (step === "weak") {
    return (
      <div className={styles.root}>
        {back}
        <div className={styles.weakTitle}>QUE VEUX-TU TRAVAILLER ?</div>
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
                {o.label}
              </button>
            );
          })}
        </div>
        <div className={styles.counter}>
          {weak.length} sélectionné{weak.length > 1 ? "s" : ""} sur {MAX_WEAK_POINTS} maximum
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div data-bottom-bar className={styles.footer}>
          <button
            type="button"
            className={styles.validate}
            disabled={busy}
            onClick={() => (weak.length === 0 ? setError("Choisis au moins un mouvement.") : validate(weak))}
          >
            <span className={styles.validateLabel}>Valider</span>
            <span className={styles.validateSub}>Thème {themeLabel(data.slug, theme)} · {weeks} semaines</span>
          </button>
        </div>
      </div>
    );
  }

  // Bloc terminé : écran de fin de bloc avant le choix du thème (le bouton ouvre l'écran de choix).
  if (data.current.finished && !choosing) {
    const label = themeLabel(data.slug, data.current.theme).toUpperCase();
    const next = data.suggested ? themeLabel(data.slug, data.suggested) : null;
    return (
      <div className={styles.root}>
        {back}
        <h1 className={styles.title}>Mon bloc d&apos;entraînement</h1>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.cardTitle}>BLOC TERMINÉ : {label}</span>
            <span className={styles.cardWeek}>{data.current.weeks} semaines</span>
          </div>
          <WeekBar weeks={data.current.weeks} done={data.current.weeks - 1} />
          <div className={styles.endText}>
            {data.current.weeks - 1} semaines de progression, 1 semaine de décharge. Que veux-tu travailler ensuite ?
            {next ? ` Thème conseillé : ${next}.` : ""}
          </div>
          <button type="button" className={styles.cta} onClick={() => setChoosing(true)}>
            CHOISIR LE BLOC SUIVANT
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
          <span className={styles.cardTitle}>BLOC EN COURS : {themeLabel(data.slug, data.current.theme).toUpperCase()}</span>
          <span className={styles.cardWeek}>
            SEMAINE {data.current.week} SUR {data.current.weeks}
          </span>
        </div>
        <WeekBar weeks={data.current.weeks} done={data.current.week} />
        <div className={styles.legend}>
          Semaines 1 à {data.current.weeks - 1} de progression, semaine {data.current.weeks} de décharge
        </div>
      </div>

      <h1 className={styles.title}>Mon bloc d&apos;entraînement</h1>

      <div className={styles.section} style={{ marginTop: 0 }}>
        Choisis ton thème
      </div>
      {data.competition && (
        <p className={styles.notice}>
          Mode compétition activé d&apos;après ta date : les thèmes Force, Endurance, Capacité et Haltérophilie ne s&apos;appliquent plus pendant la préparation.
        </p>
      )}
      <div className={styles.list}>
        {data.themes.map((t) => {
          const off = !!t.auto || blocked(t.id);
          const on = theme === t.id;
          return (
            <div
              key={t.id}
              role="radio"
              aria-checked={on}
              aria-disabled={off}
              tabIndex={0}
              className={`${on ? styles.optOn : styles.opt} ${off ? styles.optOff : ""}`}
              onClick={() => !off && setTheme(t.id)}
              onKeyDown={(e) => {
                if (!off && (e.key === "Enter" || e.key === " ")) setTheme(t.id);
              }}
            >
              <span className={on ? styles.radioOn : styles.radio} />
              <span className={styles.optBody}>
                <span className={styles.optName}>
                  {t.label}
                  {t.isDefault && !volumeBlock && <span className={styles.pill}>par défaut</span>}
                  {data.suggested === t.id && <span className={styles.pill}>conseillé</span>}
                </span>
                <span className={styles.optDesc} style={{ display: "block" }}>
                  {t.description}
                </span>
                {volumeBlock && VOLUME_BLOCK_MARKS[t.id] && (
                  <span className={styles.marks} style={{ display: "block" }}>
                    {VOLUME_BLOCK_MARKS[t.id].map((m) => `${m.label} ${m.value}`).join(" · ")}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.section}>
        Durée du bloc<span className={styles.sectionNote}>décharge comprise</span>
      </div>
      <div className={styles.seg3} role="radiogroup" aria-label="Durée du bloc">
        {WEEK_OPTIONS.map((w) => (
          <button key={w} type="button" role="radio" aria-checked={weeks === w} className={weeks === w ? styles.seg3On : styles.seg3Btn} onClick={() => setWeeks(w)}>
            {w} semaines
          </button>
        ))}
      </div>

      <div className={styles.warn}>
        <span className={styles.warnIcon}>ⓘ</span>
        <span>Changer de thème en cours de bloc interrompt ta progression actuelle.</span>
      </div>
      {error && <div className={styles.error}>{error}</div>}

      <div data-bottom-bar className={styles.footer}>
        <button
          type="button"
          className={styles.validate}
          disabled={busy}
          onClick={() => (theme === "points_faibles" ? setStep("weak") : validate([]))}
        >
          <span className={styles.validateLabel}>Valider</span>
          <span className={styles.validateSub}>Thème {themeLabel(data.slug, theme)} · {weeks} semaines</span>
        </button>
      </div>
    </div>
  );
}
