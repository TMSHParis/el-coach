"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { updateSessionRecap } from "../actions";
import type { SessionRecapPatch } from "../actions";
import { SESSION_FEELINGS } from "@/lib/session-feeling";
import {
  bestSerieIndex,
  blocKeyResult,
  fmtDurationH,
  fmtSerie,
  type MissingEntry,
  type RecapBloc,
  type WatchData,
} from "@/lib/recap-text";
import styles from "./recap.module.css";

/** "Dim. 11 octobre" */
function fmtDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const text = new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

export function RecapView({
  date,
  sport,
  durationSec,
  completionRate,
  feeling: initialFeeling,
  note: initialNote,
  blocs,
  missing,
  comparisons,
  coachText,
  watch,
  watchText,
  gauge,
  onUpdate = updateSessionRecap,
}: {
  date: string;
  sport: string;
  durationSec: number;
  completionRate: number;
  feeling: string | null;
  note: string | null;
  blocs: RecapBloc[];
  missing: MissingEntry[];
  comparisons: { nom: string; delta: number; charge: number }[];
  /** Message du coach, calculé à partir de données connues uniquement. */
  coachText: string | null;
  /** Null = aucune montre connectée : la section n'est pas affichée. */
  watch: WatchData | null;
  watchText: string | null;
  gauge: { min: number; max: number; value: number } | null;
  /** Cible de l'enregistrement — Session (par date) par défaut. Une 2e
   * activité du jour (doc G.3) passe sa propre action, liée par id. */
  onUpdate?: (date: string, patch: SessionRecapPatch) => Promise<{ ok: boolean }>;
}) {
  const [feeling, setFeeling] = useState(initialFeeling);
  const [note, setNote] = useState(initialNote ?? "");
  const [openBlocs, setOpenBlocs] = useState<Set<number>>(new Set());
  const [missingOpen, setMissingOpen] = useState(false);
  const percent = Math.round(completionRate * 100);

  // La note libre s'enregistre après une pause de frappe — pas de bouton
  // "Sauvegarder", pas un aller-retour serveur par caractère.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (note === (initialNote ?? "")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void onUpdate(date, { note });
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, date, initialNote]);

  function chooseFeeling(value: string) {
    setFeeling(value);
    void onUpdate(date, { feeling: value });
  }

  function toggleBloc(n: number) {
    setOpenBlocs((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  const kcal = watch?.kcalActive ?? watch?.kcalUnknown ?? null;
  const gaugePos = gauge && gauge.max > gauge.min ? Math.max(0, Math.min(1, (gauge.value - gauge.min) / (gauge.max - gauge.min))) : null;
  const subParts = [`⚡ ${sport}`, fmtDurationH(durationSec)];
  if (blocs.length > 0) subParts.push(`${blocs.length} bloc${blocs.length > 1 ? "s" : ""}`);

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        {/* Retour vers l'accueil, pas vers le dashboard. */}
        <Link href="/" className={styles.back}>
          ← Accueil
        </Link>
        <span className={styles.topDate}>{fmtDate(date)}</span>
      </div>

      <div className={styles.header}>
        <div className={styles.ringWrap}>
          <svg viewBox="0 0 120 120" className={styles.ring} aria-hidden="true">
            <circle cx="60" cy="60" r={RING_R} fill="none" stroke="#1c1c1c" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={RING_R}
              fill="none"
              stroke="#E8FF00"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - Math.min(1, Math.max(0, completionRate)))}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className={styles.ringText}>
            <div className={styles.percentValue}>{percent}%</div>
            <div className={styles.percentLabel}>Complété</div>
          </div>
        </div>
        <h1 className={styles.title}>Séance terminée</h1>
        <div className={styles.sub}>{subParts.join(" · ")}</div>
      </div>

      {missing.length > 0 && (
        <div className={styles.missing}>
          <button
            type="button"
            className={styles.missingBtn}
            onClick={() => setMissingOpen((v) => !v)}
            aria-expanded={missingOpen}
          >
            <span>Ce qui manque ({100 - percent} %)</span>
            <span className={styles.chev}>{missingOpen ? "▴" : "▾"}</span>
          </button>
          {missingOpen && (
            <ul className={styles.missingList}>
              {missing.map((m) => (
                <li key={m.bloc}>
                  <strong>{m.bloc}</strong> : {m.elements.join(", ")}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {coachText && (
        <div className={styles.congrats}>
          <div className={styles.congratsHead}>
            <span className={styles.ecBadge}>EC</span>
            <span className={styles.congratsLabel}>Message de ton coach</span>
          </div>
          {coachText}
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

      {/* RESSENTI — alimente Claude pour ajuster les prochaines séances. */}
      <div className={styles.sectionTitle}>Ton ressenti</div>
      <div className={styles.feelingBlock}>
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

      {blocs.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Résultats par bloc</div>
          <div className={styles.blocList}>
            {blocs.map((b) => {
              const open = openBlocs.has(b.bloc);
              const key = blocKeyResult(b);
              const withSeries = b.items.filter((it) => it.series.length > 0);
              return (
                <div key={b.bloc} className={styles.blocCard}>
                  <button type="button" className={styles.blocHead} onClick={() => toggleBloc(b.bloc)} aria-expanded={open}>
                    <span className={b.done ? styles.blocCheck : styles.blocCheckOff}>{b.done ? "✓" : ""}</span>
                    <span className={styles.blocInfo}>
                      <span className={styles.blocName}>{b.titre}</span>
                      {key && <span className={styles.blocKey}>{key}</span>}
                    </span>
                    <span className={styles.chev}>{open ? "▴" : "▾"}</span>
                  </button>
                  {open && (
                    <div className={styles.blocBody}>
                      {withSeries.length === 0 && !b.wodLine && (
                        <div className={styles.blocEmpty}>
                          {b.items.length > 0 ? b.items.map((it) => it.name).join(" · ") : "Aucun résultat saisi"}
                        </div>
                      )}
                      {b.wodLine && <div className={styles.blocEmpty}>{b.wodLine}</div>}
                      {withSeries.map((it) => {
                        const bestIdx = bestSerieIndex(it.series);
                        return (
                          <div key={it.name} className={styles.moveRow}>
                            <Link href={`/progress?movement=${encodeURIComponent(it.name)}`} className={styles.resultName}>
                              {it.name}
                            </Link>
                            <div className={styles.pillRow}>
                              {it.series.map((s, k) => {
                                const text = fmtSerie(s, it.kind);
                                if (!text) return null;
                                return (
                                  <span key={k} className={k === bestIdx && it.series.length > 1 ? styles.pillBest : styles.pill}>
                                    {text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {watch && (
        <>
          <div className={styles.sectionTitle}>
            Ta montre <span className={styles.auto}>✓ Auto</span>
          </div>
          <div className={styles.watchCard}>
            <div className={styles.watchStats}>
              <div>
                <div className={styles.statVal}>{kcal ?? "—"}</div>
                <div className={styles.statLabel}>{watch.kcalActive !== null ? "Kcal en activité" : "Kcal"}</div>
              </div>
              <div>
                <div className={styles.statVal}>{watch.effort ?? "—"}</div>
                <div className={styles.statLabel}>Temps d&apos;effort</div>
              </div>
              <div>
                <div className={styles.statVal}>{watch.bpm ?? "—"}</div>
                <div className={styles.statLabel}>BPM moyen</div>
              </div>
            </div>
            {watchText && <div className={styles.narratif}>{watchText}</div>}
            {gauge && gaugePos !== null && (
              <div className={styles.gauge}>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeDot} style={{ left: `${gaugePos * 100}%` }} />
                </div>
                <div className={styles.gaugeScale}>
                  <span>{gauge.min}</span>
                  <span>{gauge.max}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.ctaBar}>
        <Link href="/dashboard" className={styles.cta}>
          Voir mon dashboard →
        </Link>
      </div>
    </div>
  );
}
