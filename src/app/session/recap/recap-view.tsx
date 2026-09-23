"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SessionBlocResult } from "../actions";
import { updateSessionRecap } from "../actions";
import { SESSION_FEELINGS } from "@/lib/session-feeling";
import { SessionPhotos } from "@/components/session-photos";
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
  if (bloc.series?.length) {
    return bloc.series
      .map((s) => `${s.charge || "—"} kg × ${s.reps || "—"}${s.rpe ? ` (RPE ${s.rpe})` : ""}`)
      .join(" · ");
  }
  return [bloc.temps && `temps ${bloc.temps}`, bloc.rounds && `${bloc.rounds} rounds`, bloc.score && `${bloc.score} reps bonus`]
    .filter(Boolean)
    .join(" · ");
}

export function RecapView({
  date,
  sport,
  durationSec,
  completionRate,
  feeling: initialFeeling,
  note: initialNote,
  calories: initialCalories,
  photos: initialPhotos,
  photosEnabled,
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
  calories: number | null;
  photos: string[];
  /** Vercel Blob configuré — sinon le bouton photo est masqué. */
  photosEnabled: boolean;
  best: { nom: string; charge: number; reps: string } | null;
  comparisons: { nom: string; delta: number; charge: number }[];
  blocs: SessionBlocResult[];
  congrats: string | null;
}) {
  const [feeling, setFeeling] = useState(initialFeeling);
  const [note, setNote] = useState(initialNote ?? "");
  const [calories, setCalories] = useState(initialCalories === null ? "" : String(initialCalories));
  const [photos, setPhotos] = useState(initialPhotos);
  const percent = Math.round(completionRate * 100);

  // La note libre et les calories s'enregistrent après une pause de frappe —
  // pas de bouton "Sauvegarder", pas un aller-retour serveur par caractère.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (note === (initialNote ?? "") && calories === (initialCalories === null ? "" : String(initialCalories))) {
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void updateSessionRecap(date, {
        note,
        calories: calories.trim() === "" ? null : Number(calories),
      });
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [note, calories, date, initialNote, initialCalories]);

  function chooseFeeling(value: string) {
    setFeeling(value);
    void updateSessionRecap(date, { feeling: value });
  }

  function changePhotos(next: string[]) {
    setPhotos(next);
    void updateSessionRecap(date, { photos: next });
  }

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        {/* Retour vers l'accueil, pas vers le dashboard. */}
        <Link href="/" className={styles.back}>
          ← Accueil
        </Link>
      </div>

      <h1 className={styles.title}>🏆 Séance terminée</h1>
      <div className={styles.sub}>
        {sport} · {fmtDate(date)} · {fmtDuration(durationSec)}
      </div>

      <div className={styles.progressLabel}>
        Mouvements complétés · <strong>{percent}%</strong>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

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

      {/* CALORIES + PHOTOS */}
      <div className={styles.sectionTitle}>🔥 Calories brûlées</div>
      <div className={styles.calCard}>
        <div className={styles.calRow}>
          <div>
            <div className={styles.calLabel}>Relevées sur ta montre</div>
            <input
              className={styles.calInput}
              type="number"
              inputMode="numeric"
              placeholder="—"
              min={0}
              max={5000}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <div className={styles.calUnit}>KCAL</div>
        </div>
        {photosEnabled && (
          <div className={styles.photoZone}>
            <div className={styles.calLabel}>Photos de la séance (2 max)</div>
            <SessionPhotos photos={photos} onChange={changePhotos} />
          </div>
        )}
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

      {congrats && <div className={styles.congrats}>{congrats}</div>}

      {blocs.length > 0 && (
        <div className={styles.results}>
          <div className={styles.sectionTitle}>Résultats</div>
          {blocs.map((bloc, i) => (
            <div key={`${bloc.nom}-${i}`} className={styles.resultLine}>
              <span className={styles.resultName}>{bloc.nom}</span>
              <span className={styles.resultValue}>{blocLine(bloc)}</span>
            </div>
          ))}
        </div>
      )}

      <Link href="/dashboard" className={styles.cta}>
        Voir mon dashboard →
      </Link>
    </div>
  );
}
