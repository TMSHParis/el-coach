"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SessionBlocResult } from "../actions";
import { updateSessionRecap } from "../actions";
import { SESSION_FEELINGS } from "@/lib/session-feeling";
import styles from "./recap.module.css";

function fmtDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m} min ${String(s).padStart(2, "0")}`;
}

function fmtDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function blocLine(bloc: SessionBlocResult): string {
  return [bloc.temps && `temps ${bloc.temps}`, bloc.rounds && `${bloc.rounds} rounds`, bloc.score && `${bloc.score} reps bonus`]
    .filter(Boolean)
    .join(" · ");
}

/** RPE de l'exercice affiché en badge — celui de la dernière série renseignée. */
function blocRpe(bloc: SessionBlocResult): number | null {
  const series = bloc.series ?? [];
  for (let i = series.length - 1; i >= 0; i--) {
    const n = Number(series[i].rpe);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function rpeCls(rpe: number): string {
  if (rpe >= 8) return styles.rpeHigh;
  if (rpe >= 5) return styles.rpeMid;
  return styles.rpeLow;
}

export function RecapView({
  date,
  sport,
  durationSec,
  completionRate,
  feeling: initialFeeling,
  note: initialNote,
  calories,
  caloriesSource,
  retourNarratif,
  best,
  comparisons,
  blocs,
  congrats,
}: {
  date: string;
  sport: string;
  durationSec: number;
  completionRate: number;
  feeling: string | null;
  note: string | null;
  /** Relevées sur la montre, extraites automatiquement de la photo ajoutée en fin de
   * séance (/session) — cette page n'affiche plus que le résultat, en lecture seule. */
  calories: number | null;
  caloriesSource: string | null;
  /** Retour narratif généré par l'analyse de la photo. */
  retourNarratif: string | null;
  best: { nom: string; charge: number; reps: string } | null;
  comparisons: { nom: string; delta: number; charge: number }[];
  blocs: SessionBlocResult[];
  congrats: string | null;
}) {
  const [feeling, setFeeling] = useState(initialFeeling);
  const [note, setNote] = useState(initialNote ?? "");
  const percent = Math.round(completionRate * 100);

  // La note libre s'enregistre après une pause de frappe — pas de bouton
  // "Sauvegarder", pas un aller-retour serveur par caractère.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (note === (initialNote ?? "")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void updateSessionRecap(date, { note });
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [note, date, initialNote]);

  function chooseFeeling(value: string) {
    setFeeling(value);
    void updateSessionRecap(date, { feeling: value });
  }

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        {/* Retour vers l'accueil, pas vers le dashboard. */}
        <Link href="/" className={styles.back}>
          ← Accueil
        </Link>
      </div>

      <div className={styles.header}>
        <div className={styles.trophy}>🏆</div>
        <h1 className={styles.title}>Séance terminée</h1>
        <div className={styles.sub}>
          {sport} · {fmtDate(date)} · {fmtDuration(durationSec)}
        </div>
      </div>

      <div className={styles.percentCard}>
        <div className={styles.percentValue}>{percent}%</div>
        <div className={styles.percentLabel}>Mouvements complétés</div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
      </div>

      {best && (
        <div className={styles.best}>
          <div className={styles.bestLabel}>Meilleur résultat du jour</div>
          <div className={styles.bestValue}>
            {best.nom} — {best.charge} kg × {best.reps || "—"}
          </div>
        </div>
      )}

      {comparisons.length > 0 && (
        <div className={styles.compare}>
          {comparisons.map((c) => (
            <div key={c.nom} className={styles.compareLine}>
              <span>{c.nom}</span>
              <span className={c.delta > 0 ? styles.up : styles.down}>
                {c.delta > 0 ? "+" : ""}
                {c.delta} kg {c.delta > 0 ? "↑" : "↓"}
              </span>
            </div>
          ))}
        </div>
      )}

      {congrats && (
        <div className={styles.congrats}>
          <div className={styles.congratsLabel}>Message de ton coach</div>
          {congrats}
        </div>
      )}

      {/* RESSENTI — alimente Claude pour ajuster les prochaines séances. */}
      <div className={styles.sectionTitle}>Ton ressenti</div>
      <div className={styles.feelingBlock}>
        <div className={styles.calLabel}>Comment tu t&apos;es senti pendant la séance ?</div>
        <div className={styles.feelingRow}>
          {SESSION_FEELINGS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={feeling === f.value ? styles.feelingOn : styles.feeling}
              onClick={() => chooseFeeling(f.value)}
              aria-pressed={feeling === f.value}
            >
              <span className={styles.feelingEmoji}>{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>
        <textarea
          className={styles.noteInput}
          placeholder="Une note sur cette séance ? (facultatif)"
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* CALORIES — lecture seule : la photo se prend pendant la séance, pas ici. */}
      {(calories !== null || retourNarratif) && (
        <>
          <div className={styles.sectionTitle}>🔥 Calories brûlées</div>
          <div className={styles.calCard}>
            {calories !== null && (
              <>
                <div className={styles.calValue}>{calories}</div>
                <div className={styles.calUnit}>KCAL</div>
                {caloriesSource === "photo_auto" && (
                  <div className={styles.calAuto}>✓ Détecté automatiquement</div>
                )}
              </>
            )}
            {retourNarratif && (
              <div className={styles.narratif}>
                <div className={styles.narratifLabel}>Analyse de ta montre</div>
                {retourNarratif}
              </div>
            )}
          </div>
        </>
      )}

      {blocs.length > 0 && (
        <div className={styles.results}>
          <div className={styles.sectionTitle}>Résultats détaillés</div>
          {blocs.map((bloc, i) => {
            const rpe = blocRpe(bloc);
            return (
              <div key={`${bloc.nom}-${i}`} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <Link href={`/progress?movement=${encodeURIComponent(bloc.nom)}`} className={styles.resultName}>
                    {bloc.nom}
                  </Link>
                  {rpe !== null && <span className={`${styles.rpeBadge} ${rpeCls(rpe)}`}>RPE {rpe}</span>}
                </div>
                {bloc.series?.length ? (
                  <div className={styles.pillRow}>
                    {bloc.series.map((s, k) => (
                      <span key={k} className={styles.pill}>
                        {s.charge || "—"}kg × {s.reps || "—"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.resultValue}>{blocLine(bloc)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link href="/dashboard" className={styles.cta}>
        Voir mon dashboard →
      </Link>
    </div>
  );
}
