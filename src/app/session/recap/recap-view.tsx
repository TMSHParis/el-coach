"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SessionBlocResult } from "../actions";
import { updateSessionRecap } from "../actions";
import { SESSION_FEELINGS } from "@/lib/session-feeling";
import { SessionPhotos } from "@/components/session-photos";
import type { HistoriqueSession, PhotoExtraction } from "@/app/api/extract-photo-data/route";
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
  prenom,
  poidsJour,
  historiqueRecent,
  durationSec,
  completionRate,
  feeling: initialFeeling,
  note: initialNote,
  calories: initialCalories,
  caloriesSource: initialCaloriesSource,
  photos: initialPhotos,
  photosEnabled,
  retourNarratif: initialRetourNarratif,
  best,
  comparisons,
  blocs,
  congrats,
}: {
  date: string;
  sport: string;
  prenom: string | null;
  poidsJour: string | null;
  historiqueRecent: HistoriqueSession[];
  durationSec: number;
  completionRate: number;
  feeling: string | null;
  note: string | null;
  calories: number | null;
  caloriesSource: string | null;
  photos: string[];
  /** Vercel Blob configuré — sinon le bouton photo est masqué. */
  photosEnabled: boolean;
  /** Retour narratif déjà généré sur une photo précédente (persisté). */
  retourNarratif: string | null;
  best: { nom: string; charge: number; reps: string } | null;
  comparisons: { nom: string; delta: number; charge: number }[];
  blocs: SessionBlocResult[];
  congrats: string | null;
}) {
  const [feeling, setFeeling] = useState(initialFeeling);
  const [note, setNote] = useState(initialNote ?? "");
  const [calories, setCalories] = useState(initialCalories === null ? "" : String(initialCalories));
  const [caloriesSource, setCaloriesSource] = useState(initialCaloriesSource);
  const [photos, setPhotos] = useState(initialPhotos);
  const [retourNarratif, setRetourNarratif] = useState(initialRetourNarratif);
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
        caloriesSource: caloriesSource === "photo_auto" ? "photo_auto" : "manuel",
      });
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [note, calories, caloriesSource, date, initialNote, initialCalories]);

  function chooseFeeling(value: string) {
    setFeeling(value);
    void updateSessionRecap(date, { feeling: value });
  }

  function changePhotos(next: string[]) {
    setPhotos(next);
    void updateSessionRecap(date, { photos: next });
  }

  /** Analyse Claude de la photo — les calories ne remplacent jamais une saisie manuelle. */
  function handleExtracted(result: PhotoExtraction) {
    const patch: Parameters<typeof updateSessionRecap>[1] = {};
    if (calories.trim() === "" && typeof result.calories === "number") {
      setCalories(String(result.calories));
      setCaloriesSource("photo_auto");
      patch.calories = result.calories;
      patch.caloriesSource = "photo_auto";
    }
    if (result.retourNarratif) {
      setRetourNarratif(result.retourNarratif);
      patch.photoAnalysis = { donneesBrutes: result.donneesBrutes, retourNarratif: result.retourNarratif };
    }
    if (Object.keys(patch).length > 0) void updateSessionRecap(date, patch);
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
        {caloriesSource === "photo_auto" && (
          <div className={styles.calAuto}>Valeur détectée automatiquement ✓ — corrige-la si besoin</div>
        )}
        {photosEnabled && (
          <div className={styles.photoZone}>
            <div className={styles.calLabel}>
              Photos de la séance (2 max) — les calories s&apos;y lisent toutes seules
            </div>
            <SessionPhotos
              photos={photos}
              onChange={changePhotos}
              onExtracted={handleExtracted}
              analysisContext={{ sport, prenom, poidsJour, sessionFeeling: feeling, historiqueRecent }}
            />
          </div>
        )}
        {retourNarratif && <div className={styles.narratif}>{retourNarratif}</div>}
      </div>

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
