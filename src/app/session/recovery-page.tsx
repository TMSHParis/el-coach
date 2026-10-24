"use client";

// Page « Récupération du jour » (partie 4, mission 4) : mode léger, sans séance. Aucun ✓, aucun pourcentage,
// aucun chrono de séance. Le chrono libre est facultatif ; « J'AI TERMINÉ » ouvre la feuille d'enregistrement.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DisplayBlock } from "@/lib/session-format";
import { SESSION_FEELINGS } from "@/lib/session-feeling";
import { saveRecoveryActivity } from "./actions";
import { RecoveryBlocks } from "./recovery-blocks";
import styles from "./recovery-page.module.css";

const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

/** Milieu d'une fourchette « 20-30 min », arrondi à 5 minutes (30 si illisible). */
function midRange(label: string): number {
  const nums = (label.match(/\d+/g) ?? []).map(Number);
  const mid = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0] ?? 30;
  return Math.max(5, Math.round(mid / 5) * 5);
}

export function RecoveryPage({
  blocks,
  duration,
  seance,
  dateLabel,
}: {
  blocks: DisplayBlock[];
  /** Durée indiquée par le contenu, ex. « 20-30 min ». */
  duration: string;
  /** Libellé choisi au check-in (« 🚶 Marche »), enregistré avec l'activité. */
  seance: string;
  dateLabel: string;
}) {
  const router = useRouter();
  // Chrono libre : horodatages, il continue app en arrière-plan.
  const [accMs, setAccMs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sheet, setSheet] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [energy, setEnergy] = useState<number | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsedMs = accMs + (startedAt !== null ? now - startedAt : 0);
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const hasChrono = elapsedMs > 0 || startedAt !== null;

  function toggleChrono() {
    if (startedAt !== null) {
      setAccMs((a) => a + (Date.now() - startedAt));
      setStartedAt(null);
    } else {
      setNow(Date.now());
      setStartedAt(Date.now());
    }
  }

  function openSheet() {
    // Le chrono s'arrête ; durée de départ = temps du chrono arrondi à 5 min, sinon milieu de la fourchette.
    if (startedAt !== null) {
      setAccMs((a) => a + (Date.now() - startedAt));
      setStartedAt(null);
    }
    const total = elapsedMs + (startedAt !== null ? Date.now() - startedAt : 0);
    setMinutes(total > 0 ? Math.max(5, Math.round(total / 60000 / 5) * 5) : midRange(duration));
    setSheet(true);
  }

  async function save() {
    setBusy(true);
    setError(false);
    const res = await saveRecoveryActivity({ durationMin: minutes, energy, feeling, seance });
    if (res.ok) router.push(res.href);
    else {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <Link href="/" className={styles.back}>
          ← Accueil
        </Link>
        <span className={styles.topDate}>{dateLabel}</span>
      </div>

      <div className={styles.header}>
        <div className={styles.status}>
          <span className={styles.dot} />
          Récupération du jour
        </div>
        <div className={styles.headMain}>
          <div className={styles.big}>RÉCUP</div>
          <div className={styles.headRight}>
            <div className={styles.headName}>🚶 Récupération active</div>
            <div className={styles.headSub}>{duration} · rien à valider</div>
          </div>
        </div>
      </div>

      <div className={styles.chronoCard}>
        <div>
          <div className={styles.chrono}>{fmt(elapsedSec)}</div>
          <div className={styles.chronoSub}>Chrono libre, facultatif</div>
        </div>
        <button type="button" className={styles.chronoBtn} onClick={toggleChrono}>
          {startedAt !== null ? "⏸ Pause" : hasChrono ? "▶️ Reprendre" : "▶️ Démarrer"}
        </button>
      </div>

      <div className={styles.sectionTitle}>
        <span>Tes mouvements</span>
      </div>
      <p className={styles.help}>Consulte les mouvements quand tu veux. Les ▶️ ouvrent les vidéos.</p>
      <RecoveryBlocks blocks={blocks} />

      <div className={styles.ctaBar}>
        <button type="button" className={styles.cta} onClick={openSheet}>
          J&apos;AI TERMINÉ
        </button>
      </div>

      {sheet && (
        <div className={styles.overlay} onClick={() => setSheet(false)}>
          <div className={styles.sheet} role="dialog" aria-label="Enregistrer mon activité" onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetTitle}>Enregistrer mon activité</div>
            <div className={styles.sheetHelp}>Tout est facultatif sauf la durée.</div>

            <div className={styles.label}>Durée</div>
            <div className={styles.stepper}>
              <button type="button" className={styles.stepBtn} onClick={() => setMinutes((m) => Math.max(5, m - 5))} aria-label="Moins 5 minutes">
                −
              </button>
              <div className={styles.stepVal}>{minutes} min</div>
              <button type="button" className={styles.stepBtn} onClick={() => setMinutes((m) => m + 5)} aria-label="Plus 5 minutes">
                ＋
              </button>
            </div>

            <div className={styles.label}>Énergie</div>
            <div className={styles.segments}>
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={energy !== null && i < energy ? styles.segOn : styles.seg}
                  onClick={() => setEnergy(i + 1)}
                  aria-label={`Énergie ${i + 1} sur 10`}
                />
              ))}
            </div>

            <div className={styles.label}>Ressenti</div>
            <div className={styles.tiles}>
              {SESSION_FEELINGS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={feeling === f.value ? styles.tileOn : styles.tile}
                  onClick={() => setFeeling(f.value)}
                  aria-pressed={feeling === f.value}
                >
                  <span className={styles.tileEmoji}>{f.emoji}</span>
                  <span className={styles.tileLabel}>{f.label}</span>
                </button>
              ))}
            </div>

            {error && <div className={styles.error}>Enregistrement impossible, réessaie.</div>}
            <button type="button" className={styles.save} onClick={() => void save()} disabled={busy}>
              ENREGISTRER
            </button>
            <button type="button" className={styles.cancel} onClick={() => setSheet(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
