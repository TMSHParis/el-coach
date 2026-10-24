"use client";

// Page de fin d'activité (partie 4, mission 3). Situation A = séance ECM terminée, B = autre activité.
// Couleur de la situation : A = accent du dashboard, B = bleu clair.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { updateSessionRecap } from "../actions";
import { upgradeChain } from "../chain-actions";
import type { ChainId } from "@/lib/chains";
import type { SessionRecapPatch } from "../actions";
import type { DisplayBlock } from "@/lib/session-format";
import { SESSION_FEELINGS } from "@/lib/session-feeling";
import { bestSerieIndex, fmtSerie, type MissingEntry, type RecapBloc, type WatchData } from "@/lib/recap-text";
import { ActivityCard } from "@/app/dashboard/activity-card";
import { RecoveryBlocks } from "../recovery-blocks";
import styles from "./recap.module.css";

/** Petit libellé à droite d'un bloc : « Terminé », « 5 × 5 » ou « Non réalisé ». */
function blocLabel(b: RecapBloc): string {
  if (!b.done) return "Non réalisé";
  const lines = b.items.filter((i) => i.series.length > 0);
  if (b.items.length === 1 && lines.length === 1) {
    const s = lines[0].series;
    const reps = s[0]?.reps?.trim();
    if (reps && s.every((x) => x.reps?.trim() === reps)) return `${s.length} × ${reps}`;
  }
  return "Terminé";
}

export function RecapView({
  situation,
  date,
  dateLabel,
  name,
  icon,
  durationSec,
  percent,
  energy,
  mental,
  feeling: initialFeeling,
  note: initialNote,
  blocs,
  missing,
  comparisons,
  coachText,
  watch,
  chainProposals = [],
  recovery = null,
  onUpdate = updateSessionRecap,
}: {
  situation: "A" | "B";
  date: string;
  /** « Ven. 23 octobre » */
  dateLabel: string;
  name: string;
  icon: string;
  durationSec: number;
  /** Pourcentage de la séance réalisée — situation A seulement. */
  percent: number;
  energy: number | null;
  mental: string | null;
  feeling: string | null;
  note: string | null;
  blocs: RecapBloc[];
  missing: MissingEntry[];
  comparisons: { nom: string; delta: number; charge: number }[];
  /** Message du coach, calculé à partir de données connues uniquement. */
  coachText: string | null;
  /** Null = aucune montre connectée : la section n'est pas affichée. */
  watch: WatchData | null;
  /** At Home : montées de cran proposées (objectif de reps atteint). */
  chainProposals?: { chain: ChainId; from: string; to: string; toIndex: number }[];
  /** Récupération : blocs consultables (situation B d'une récupération). */
  recovery?: DisplayBlock[] | null;
  /** Cible de l'enregistrement — Session (par date) par défaut. */
  onUpdate?: (date: string, patch: SessionRecapPatch) => Promise<{ ok: boolean }>;
}) {
  const [feeling, setFeeling] = useState(initialFeeling);
  const [note, setNote] = useState(initialNote ?? "");
  const [openBlocs, setOpenBlocs] = useState<Set<number>>(new Set());
  const [missingOpen, setMissingOpen] = useState(false);
  const [upgraded, setUpgraded] = useState<Set<string>>(new Set());
  const noun = situation === "A" ? "cette séance" : "cette activité";

  // La note libre s'enregistre après une pause de frappe.
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

  const toggleBloc = (n: number) =>
    setOpenBlocs((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  // Montre : on n'affiche que les mesures reçues.
  const kcal = watch?.kcalActive ?? watch?.kcalUnknown ?? null;
  const missingWatch = [watch?.effort ? null : "Temps d'effort", watch?.bpm ? null : "fréquence cardiaque"].filter(Boolean) as string[];

  return (
    <div className={`${styles.root} ${situation === "B" ? styles.sitB : styles.sitA}`}>
      <div className={styles.top}>
        <Link href="/" className={styles.back}>
          ← Accueil
        </Link>
        <span className={styles.topDate}>{dateLabel}</span>
      </div>

      <ActivityCard
        showPlus={false}
        data={{
          situation,
          dateLabel: "",
          durationSec,
          icon,
          name,
          percent,
          energy,
          detailHref: "",
          recap: { mental },
        }}
      />

      {situation === "A" && missing.length > 0 && percent < 100 && (
        <div className={styles.missing}>
          <button type="button" className={styles.missingBtn} onClick={() => setMissingOpen((v) => !v)} aria-expanded={missingOpen}>
            <span>Ce qui manque</span>
            <span className={styles.missingPct}>{100 - percent} %</span>
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
        <div className={styles.coachCard}>
          <div className={styles.ec}>EC</div>
          <div>
            <div className={styles.coachName}>Ton coach</div>
            <p className={styles.coachText}>{coachText}</p>
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

      {chainProposals.length > 0 && (
        <div className={styles.coachCard} style={{ display: "block" }}>
          <div className={styles.coachName}>Monter d&apos;un cran ?</div>
          {chainProposals.map((p) => (
            <div key={p.chain} className={styles.compareLine}>
              <span>
                {p.from} → {p.to}
              </span>
              <button
                type="button"
                className={styles.pill}
                disabled={upgraded.has(p.chain)}
                onClick={async () => {
                  const res = await upgradeChain(p.chain, p.toIndex);
                  if (res.ok) setUpgraded((u) => new Set(u).add(p.chain));
                }}
              >
                {upgraded.has(p.chain) ? "✓ Monté" : "Monter"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.sectionTitle}>
        <span>Ton ressenti</span>
      </div>
      <div className={styles.tiles}>
        {SESSION_FEELINGS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={feeling === f.value ? styles.tileOn : styles.tile}
            onClick={() => chooseFeeling(f.value)}
            aria-pressed={feeling === f.value}
          >
            <span className={styles.tileEmoji}>{f.emoji}</span>
            <span className={styles.tileLabel}>{f.label}</span>
          </button>
        ))}
      </div>
      <textarea
        className={styles.noteInput}
        placeholder={`Une note sur ${noun} ? (facultatif)`}
        value={note}
        maxLength={1000}
        onChange={(e) => setNote(e.target.value)}
      />

      {situation === "A" && blocs.length > 0 && (
        <>
          <div className={styles.sectionTitle}>
            <span>Résultats par bloc</span>
          </div>
          <div className={styles.blocList}>
            {blocs.map((b) => {
              const open = openBlocs.has(b.bloc);
              const withSeries = b.items.filter((it) => it.series.length > 0);
              return (
                <div key={b.bloc} className={styles.blocCard}>
                  <button type="button" className={styles.blocHead} onClick={() => toggleBloc(b.bloc)} aria-expanded={open}>
                    <span className={b.done ? styles.blocCheck : styles.blocCheckOff}>{b.done ? "✓" : "–"}</span>
                    <span className={styles.blocName}>{b.titre}</span>
                    <span className={styles.blocLabel}>{blocLabel(b)}</span>
                    <span className={`${styles.chev} ${open ? styles.chevOpen : ""}`}>▾</span>
                  </button>
                  {open && (
                    <div className={styles.blocBody}>
                      {b.wodLine && <div>{b.wodLine}</div>}
                      {withSeries.length === 0 && !b.wodLine && (
                        <div>{b.items.length > 0 ? b.items.map((it) => it.name).join(" · ") : "Aucun résultat saisi"}</div>
                      )}
                      {withSeries.map((it) => {
                        const best = bestSerieIndex(it.series);
                        return (
                          <div key={it.name}>
                            <Link href={`/progress?movement=${encodeURIComponent(it.name)}`} className={styles.resultName}>
                              {it.name}
                            </Link>
                            {it.replacedFrom && <span className={styles.replacedNote}> · remplacé, à la place de {it.replacedFrom}</span>}
                            {" : "}
                            {it.series
                              .map((s, k) => {
                                const text = fmtSerie(s, it.kind);
                                return text ? (k === best && it.series.length > 1 ? `${text} ★` : text) : null;
                              })
                              .filter(Boolean)
                              .join(" · ")}
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

      {situation === "B" && recovery && recovery.length > 0 && (
        <>
          <div className={styles.sectionTitle}>
            <span>Ta récupération</span>
          </div>
          <RecoveryBlocks blocks={recovery} />
        </>
      )}

      {watch && (
        <>
          <div className={styles.sectionTitle}>
            <span>Ta montre</span>
            <span className={styles.auto}>✓ AUTO</span>
          </div>
          <div className={styles.watchCard}>
            {kcal !== null && (
              <div className={styles.kcalRow}>
                <span className={styles.kcal}>{kcal}</span>
                <span className={styles.kcalUnit}>{watch.kcalActive !== null ? "kcal en activité" : "kcal"}</span>
              </div>
            )}
            {(watch.effort || watch.bpm) && (
              <div className={styles.watchStats}>
                {watch.effort && (
                  <div>
                    <div className={styles.statVal}>{watch.effort}</div>
                    <div className={styles.statLabel}>Temps d&apos;effort</div>
                  </div>
                )}
                {watch.bpm && (
                  <div>
                    <div className={styles.statVal}>{watch.bpm}</div>
                    <div className={styles.statLabel}>BPM moyen</div>
                  </div>
                )}
              </div>
            )}
            {missingWatch.length > 0 && (
              <p className={styles.watchMissing}>
                {missingWatch.length === 2
                  ? "Temps d'effort et fréquence cardiaque : pas de donnée reçue de ta montre."
                  : `${missingWatch[0].charAt(0).toUpperCase() + missingWatch[0].slice(1)} : pas de donnée reçue de ta montre.`}
              </p>
            )}
          </div>
        </>
      )}

      <div className={styles.ctaBar}>
        <Link href="/dashboard" className={styles.cta}>
          VOIR MON DASHBOARD
        </Link>
      </div>
    </div>
  );
}
