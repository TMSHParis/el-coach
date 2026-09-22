"use client";

import { useState } from "react";
import Link from "next/link";
import type { SessionBlocResult } from "../actions";
import { rateSession } from "../actions";
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
  rating: initialRating,
  best,
  comparisons,
  blocs,
  congrats,
}: {
  date: string;
  sport: string;
  durationSec: number;
  completionRate: number;
  rating: number;
  best: { nom: string; charge: number; reps: string } | null;
  comparisons: { nom: string; delta: number; charge: number }[];
  blocs: SessionBlocResult[];
  congrats: string | null;
}) {
  const [rating, setRating] = useState(initialRating);
  const percent = Math.round(completionRate * 100);

  function rate(value: number) {
    setRating(value);
    void rateSession(date, value);
  }

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <Link href="/dashboard" className={styles.back}>
          ← Dashboard
        </Link>
      </div>

      <h1 className={styles.title}>Séance terminée ✓</h1>
      <div className={styles.sub}>
        {sport} · {fmtDate(date)} · {fmtDuration(durationSec)}
      </div>

      <div className={styles.progressLabel}>
        Mouvements complétés · <strong>{percent}%</strong>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.ratingRow}>
        <span className={styles.ratingLabel}>Note de la séance</span>
        <div>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= rating ? styles.starOn : styles.star}
              onClick={() => rate(star)}
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
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

      {congrats && <div className={styles.congrats}>{congrats}</div>}

      {blocs.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsTitle}>Résultats</div>
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
