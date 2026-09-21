"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DisplayBlock } from "@/lib/session-format";
import type { BlockType } from "@/lib/programming";
import styles from "./session.module.css";
import { SessionItemRow } from "../dashboard/session-item-row";
import { saveSessionResult, type SessionBlocResult } from "./actions";
import {
  ensureAudio,
  soundEnd,
  soundRest,
  soundStart,
  soundTick,
  soundTransition,
  soundWork,
  speak,
  vibrate,
} from "@/lib/session-audio";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

type RuntimeFormat = "nft" | "ft" | "amrap" | "emom" | "tabata";

const FORMAT_LABELS: Record<RuntimeFormat, string> = {
  nft: "Not For Time",
  ft: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  tabata: "Tabata",
};

const COUNTDOWN_SEC = 10;
const TICK_MS = 200;

/** Blocs où la saisie se fait par exercice (charge × reps, plusieurs séries). */
const SERIES_RESULT_TYPES: BlockType[] = ["strength", "accessory", "skill"];
/** Blocs où la saisie se fait une fois pour tout le bloc (temps/rounds/reps bonus). */
const WOD_RESULT_TYPES: BlockType[] = ["wod", "conditioning"];
/** Blocs cardio : un temps par exercice. */
const TIME_RESULT_TYPES: BlockType[] = ["endurance"];

type ExerciseSerie = { charge: string; reps: string };

type BlocState = {
  /** Instant du dernier démarrage (ms epoch) — le chrono se recalcule depuis l'horloge,
   * il continue donc à tourner quand l'app passe en arrière-plan. */
  startedAt: number | null;
  /** Temps déjà écoulé avant la pause en cours (ms). */
  accumulatedMs: number;
  running: boolean;
  done: boolean;
  finalSec: number;
  format: RuntimeFormat;
  durationMin: number;
  workSec: number;
  restSec: number;
  tabataRounds: number;
  /** Fin du compte à rebours de départ (ms epoch), null hors compte à rebours. */
  countdownEndsAt: number | null;
  open: boolean;
  /** Mouvements cochés du bloc. */
  checked: boolean[];
  exerciseSeries: ExerciseSerie[][];
  exerciseTimes: string[];
  temps: string;
  rounds: string;
  score: string;
};

function fmtMS(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtHMS(totalSec: number): string {
  const t = Math.max(0, totalSec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Temps écoulé du bloc, calculé depuis l'horloge (pas un compteur incrémenté). */
function elapsedSec(b: BlocState, now: number): number {
  const runningMs = b.running && b.startedAt ? now - b.startedAt : 0;
  return Math.max(0, Math.floor((b.accumulatedMs + runningMs) / 1000));
}

type TabataView = { round: number; phase: "work" | "rest"; remaining: number; finished: boolean };

function tabataView(b: BlocState, elapsed: number): TabataView {
  const cycle = Math.max(1, b.workSec + b.restSec);
  const round = Math.floor(elapsed / cycle) + 1;
  const inCycle = elapsed % cycle;
  const phase: "work" | "rest" = inCycle < b.workSec ? "work" : "rest";
  const remaining = phase === "work" ? b.workSec - inCycle : cycle - inCycle;
  return { round, phase, remaining, finished: round > b.tabataRounds };
}

export function SessionRunnerV2({
  sessionName,
  sessionMeta,
  blocks: blockData,
  initial,
  date,
  variant,
}: {
  sessionName: string;
  sessionMeta: string;
  blocks: DisplayBlock[];
  initial: { format: RuntimeFormat; durationMin: number; tabataRounds: number }[];
  date: string;
  variant: "A" | "B";
}) {
  const router = useRouter();
  const storageKey = `elc_session_${date}`;

  const makeInitial = useCallback(
    (): BlocState[] =>
      initial.map((cfg, i) => {
        const type = blockData[i]?.type;
        const items = blockData[i]?.items ?? [];
        return {
          startedAt: null,
          accumulatedMs: 0,
          running: false,
          done: false,
          finalSec: 0,
          format: cfg.format,
          durationMin: cfg.durationMin,
          workSec: 20,
          restSec: 10,
          tabataRounds: cfg.tabataRounds,
          countdownEndsAt: null,
          open: i === 0,
          checked: items.map(() => false),
          exerciseSeries: type && SERIES_RESULT_TYPES.includes(type) ? items.map(() => [{ charge: "", reps: "" }]) : [],
          exerciseTimes: items.map(() => ""),
          temps: "",
          rounds: "",
          score: "",
        };
      }),
    [blockData, initial],
  );

  const [blocks, setBlocks] = useState<BlocState[]>(makeInitial);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());
  const [restored, setRestored] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [congrats, setCongrats] = useState<string | null>(null);
  const blocRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const savedRef = useRef(false);

  // Reprise après un retour dans l'app (ou un rechargement) : tout l'état du
  // chrono est relu depuis localStorage, les timestamps font le reste.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { sessionStartedAt: number; blocks: BlocState[] };
        if (saved.blocks?.length === initial.length && typeof saved.sessionStartedAt === "number") {
          setBlocks(saved.blocks);
          setSessionStartedAt(saved.sessionStartedAt);
        }
      }
    } catch {
      // Stockage indisponible — la séance démarre simplement à zéro.
    }
    setRestored(true);
  }, [storageKey, initial.length]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ sessionStartedAt, blocks }));
    } catch {
      // Quota/mode privé — sans persistance, le chrono reste juste tant que l'onglet vit.
    }
  }, [blocks, sessionStartedAt, restored, storageKey]);

  // Horloge unique : tous les affichages dérivent de `now`.
  useEffect(() => {
    if (sessionDone) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [sessionDone]);

  // Wake lock — écran allumé pendant toute la séance, réactivé au retour dans l'app.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let released = false;

    async function request() {
      try {
        if ("wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      } catch {
        // Wake Lock non supporté ou refusé — pas bloquant.
      }
    }
    void request();

    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  const finishBloc = useCallback((i: number, endSec?: number) => {
    setBlocks((prev) =>
      prev.map((x, idx) => {
        if (idx !== i) return x;
        const sec = endSec ?? elapsedSec(x, Date.now());
        return { ...x, running: false, startedAt: null, accumulatedMs: sec * 1000, done: true, finalSec: sec };
      }),
    );
  }, []);

  // Compte à rebours, transitions sonores et fins automatiques.
  const tickRef = useRef<Record<number, number>>({});
  const minuteRef = useRef<Record<number, number>>({});
  const tabataRef = useRef<Record<number, string>>({});

  useEffect(() => {
    blocks.forEach((b, i) => {
      if (b.countdownEndsAt) {
        const remaining = Math.ceil((b.countdownEndsAt - now) / 1000);
        if (remaining <= 0) {
          tickRef.current[i] = -1;
          soundStart();
          speak("Go !");
          vibrate([400]);
          setBlocks((prev) =>
            prev.map((x, idx) =>
              idx === i ? { ...x, countdownEndsAt: null, running: true, startedAt: Date.now() } : x,
            ),
          );
          return;
        }
        if (tickRef.current[i] !== remaining) {
          tickRef.current[i] = remaining;
          soundTick();
          vibrate([40]);
          if (remaining <= 3) speak(String(remaining));
          else if (remaining === COUNTDOWN_SEC) speak(`Démarrage dans ${COUNTDOWN_SEC} secondes`);
        }
        return;
      }

      if (!b.running || b.done) return;
      const elapsed = elapsedSec(b, now);

      if (b.format === "amrap") {
        const total = b.durationMin * 60;
        if (elapsed >= total) {
          soundEnd();
          speak("Temps écoulé ! Notez vos rounds.");
          vibrate([600]);
          finishBloc(i, total);
        }
        return;
      }

      if (b.format === "emom") {
        const total = b.durationMin * 60;
        if (elapsed >= total) {
          soundEnd();
          speak("EMOM terminé !");
          vibrate([600]);
          finishBloc(i, total);
          return;
        }
        const minute = Math.floor(elapsed / 60) + 1;
        if (minuteRef.current[i] === undefined) minuteRef.current[i] = minute;
        else if (minute !== minuteRef.current[i]) {
          minuteRef.current[i] = minute;
          soundTransition();
          speak("Minute suivante !");
          vibrate([120]);
        }
        return;
      }

      if (b.format === "tabata") {
        const view = tabataView(b, elapsed);
        if (view.finished) {
          soundEnd();
          speak("Tabata terminé !");
          vibrate([600]);
          finishBloc(i, b.tabataRounds * (b.workSec + b.restSec));
          return;
        }
        const key = `${view.round}-${view.phase}`;
        if (tabataRef.current[i] === undefined) tabataRef.current[i] = key;
        else if (tabataRef.current[i] !== key) {
          tabataRef.current[i] = key;
          vibrate([120]);
          if (view.phase === "work") {
            soundWork();
            speak(view.round === b.tabataRounds ? "Dernier tour !" : "Travail !");
          } else {
            soundRest();
            speak("Repos !");
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function startTimer(i: number) {
    ensureAudio(); // geste utilisateur : seul moment où le son peut être autorisé
    setBlocks((prev) =>
      prev.map((x, idx) => {
        if (idx !== i || x.running || x.done || x.countdownEndsAt) return x;
        // Reprise après pause : pas de nouveau compte à rebours.
        if (x.accumulatedMs > 0) return { ...x, running: true, startedAt: Date.now() };
        return { ...x, countdownEndsAt: Date.now() + COUNTDOWN_SEC * 1000 };
      }),
    );
  }

  function pauseTimer(i: number) {
    setBlocks((prev) =>
      prev.map((x, idx) => {
        if (idx !== i || !x.running) return x;
        const acc = x.accumulatedMs + (x.startedAt ? Date.now() - x.startedAt : 0);
        return { ...x, running: false, startedAt: null, accumulatedMs: acc };
      }),
    );
  }

  function resetTimer(i: number) {
    tickRef.current[i] = -1;
    delete minuteRef.current[i];
    delete tabataRef.current[i];
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i
          ? { ...x, startedAt: null, accumulatedMs: 0, running: false, done: false, finalSec: 0, countdownEndsAt: null }
          : x,
      ),
    );
  }

  function doneBloc(i: number) {
    const b = blocks[i];
    const sec = elapsedSec(b, Date.now());
    if (b.format === "ft" && b.running) {
      soundEnd();
      speak(`Bien joué ! Temps : ${fmtMS(sec)}`);
      vibrate([600]);
    } else {
      soundTransition();
      vibrate([80]);
    }
    finishBloc(i, sec);
  }

  function cancelCountdown(i: number) {
    tickRef.current[i] = -1;
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, countdownEndsAt: null } : x)));
  }

  function changeFormat(i: number, fmt: RuntimeFormat) {
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i ? { ...x, format: fmt, startedAt: null, accumulatedMs: 0, running: false, countdownEndsAt: null } : x,
      ),
    );
  }

  function patchBloc(i: number, patch: Partial<BlocState>) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function toggleOpen(i: number) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, open: !x.open } : x)));
  }

  const openBloc = useCallback((i: number) => {
    setBlocks((prev) => prev.map((x, idx) => ({ ...x, open: idx === i ? true : x.open })));
    setTimeout(() => blocRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  function toggleChecked(blocIdx: number, exIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx ? { ...x, checked: x.checked.map((c, j) => (j === exIdx ? !c : c)) } : x,
      ),
    );
    vibrate([30]);
  }

  function addSerie(blocIdx: number, exIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? { ...x, exerciseSeries: x.exerciseSeries.map((es, j) => (j === exIdx ? [...es, { charge: "", reps: "" }] : es)) }
          : x,
      ),
    );
  }

  function updateSerie(blocIdx: number, exIdx: number, serieIdx: number, patch: Partial<ExerciseSerie>) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? {
              ...x,
              exerciseSeries: x.exerciseSeries.map((es, j) =>
                j === exIdx ? es.map((s, k) => (k === serieIdx ? { ...s, ...patch } : s)) : es,
              ),
            }
          : x,
      ),
    );
  }

  function removeSerie(blocIdx: number, exIdx: number, serieIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? { ...x, exerciseSeries: x.exerciseSeries.map((es, j) => (j === exIdx ? es.filter((_, k) => k !== serieIdx) : es)) }
          : x,
      ),
    );
  }

  function setExerciseTime(blocIdx: number, exIdx: number, value: string) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx ? { ...x, exerciseTimes: x.exerciseTimes.map((t, j) => (j === exIdx ? value : t)) } : x,
      ),
    );
  }

  const doneCount = blocks.filter((b) => b.done).length;
  const total = blocks.length;
  const globalSec = Math.max(0, Math.floor((now - sessionStartedAt) / 1000));

  const movementsTotal = useMemo(() => blockData.reduce((sum, b) => sum + b.items.length, 0), [blockData]);
  const movementsDone = blocks.reduce((sum, b) => sum + b.checked.filter(Boolean).length, 0);
  const completionRate = movementsTotal > 0 ? movementsDone / movementsTotal : 0;

  // Ouvre le bloc suivant quand un bloc se termine, et détecte la fin de séance.
  const prevDoneRef = useRef<boolean[]>(blocks.map((b) => b.done));
  useEffect(() => {
    const prevDone = prevDoneRef.current;
    blocks.forEach((b, i) => {
      if (b.done && !prevDone[i] && i + 1 < blocks.length && !blocks[i + 1].done) openBloc(i + 1);
    });
    prevDoneRef.current = blocks.map((b) => b.done);
  }, [blocks, openBloc]);

  function endSession() {
    setSessionDone(true);
  }

  function confirmBack() {
    if (sessionDone) {
      router.push("/dashboard");
      return;
    }
    if (window.confirm("Quitter la séance ?")) router.push("/dashboard");
  }

  // Enregistrement des résultats — best effort, l'écran de fin s'affiche quoi qu'il arrive.
  useEffect(() => {
    if (!sessionDone || savedRef.current) return;
    savedRef.current = true;
    const blocs: SessionBlocResult[] = [];
    blockData.forEach((b, i) => {
      const state = blocks[i];
      b.items.forEach((it, j) => {
        const series = (state.exerciseSeries[j] ?? []).filter((s) => s.charge.trim() || s.reps.trim());
        const temps = state.exerciseTimes[j]?.trim();
        if (series.length > 0) blocs.push({ bloc: i + 1, nom: it.name, series });
        else if (temps) blocs.push({ bloc: i + 1, nom: it.name, temps });
      });
      if (state.temps || state.rounds || state.score) {
        blocs.push({
          bloc: i + 1,
          nom: b.titre,
          temps: state.temps || undefined,
          rounds: state.rounds || undefined,
          score: state.score || undefined,
        });
      }
    });

    saveSessionResult({ date, variant, blocs, durationSec: globalSec, completionRate })
      .then((res) => {
        if (res.ok && res.message) setCongrats(res.message);
      })
      .catch(() => {});
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Rien à nettoyer si le stockage est indisponible.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDone]);

  if (sessionDone) {
    const results = blockData.flatMap((b, i) => {
      const state = blocks[i];
      const lines: string[] = [];
      b.items.forEach((it, j) => {
        const series = (state.exerciseSeries[j] ?? []).filter((s) => s.charge.trim() || s.reps.trim());
        if (series.length > 0) {
          lines.push(`${it.name} — ${series.map((s) => `${s.charge || "—"} kg × ${s.reps || "—"}`).join(" · ")}`);
        }
        const temps = state.exerciseTimes[j]?.trim();
        if (temps) lines.push(`${it.name} — ${temps}`);
      });
      const blocLine = [
        state.temps && `temps ${state.temps}`,
        state.rounds && `${state.rounds} rounds`,
        state.score && `${state.score} reps bonus`,
      ]
        .filter(Boolean)
        .join(" · ");
      if (blocLine) lines.push(`${b.titre} — ${blocLine}`);
      return lines.length > 0 ? [{ titre: b.titre, lines }] : [];
    });

    return (
      <div className={styles.sessRoot}>
        <div className={cx(styles.success, styles.show)}>
          <div className={styles.successIcon}>⚡</div>
          <div className={styles.successTitle}>
            Séance
            <br />
            terminée.
          </div>
          <div className={styles.successSub}>
            <strong>{sessionName}</strong>
            <br />
            Complétée en {fmtHMS(globalSec)}
          </div>
          <div className={styles.successStats}>
            <div className={styles.ssCard}>
              <div className={styles.ssVal}>{fmtMS(globalSec)}</div>
              <div className={styles.ssLabel}>Durée</div>
            </div>
            <div className={styles.ssCard}>
              <div className={styles.ssVal}>
                {movementsDone}/{movementsTotal}
              </div>
              <div className={styles.ssLabel}>Mouvements</div>
            </div>
            <div className={styles.ssCard}>
              <div className={styles.ssVal}>{Math.round(completionRate * 100)}%</div>
              <div className={styles.ssLabel}>Complété</div>
            </div>
          </div>

          {congrats && <div className={styles.congrats}>{congrats}</div>}

          {results.length > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryTitle}>Résultats saisis</div>
              {results.map((r) => (
                <div key={r.titre} className={styles.summaryBloc}>
                  <div className={styles.summaryBlocTitle}>{r.titre}</div>
                  {r.lines.map((l) => (
                    <div key={l} className={styles.summaryLine}>
                      {l}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <a href="/dashboard" className={styles.successBtn}>
            Voir mon dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessRoot}>
      <div className={styles.topbar}>
        <div className={styles.tbLeft}>
          <button className={styles.tbBack} onClick={confirmBack} aria-label="Retour">
            ←
          </button>
          <div>
            <div className={styles.tbTitle}>
              {sessionName.length > 28 ? sessionName.slice(0, 28) + "…" : sessionName}
            </div>
            <div className={styles.tbSub}>EL COACH METHOD</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className={styles.globalTimer}>{fmtHMS(globalSec)}</div>
          <div className={styles.globalTimerLabel}>Durée totale</div>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }} />
      </div>

      <div className={styles.content}>
        <div className={styles.sessHero}>
          <div className={styles.sessLabel}>[ SÉANCE EN COURS ]</div>
          <div className={styles.sessName}>{sessionName}</div>
          <div className={styles.sessMeta}>{sessionMeta}</div>
        </div>

        <div>
          {blockData.map((b, i) => (
            <BlocCard
              key={`${b.titre}-${i}`}
              refCb={(el) => {
                blocRefs.current[i] = el;
              }}
              index={i}
              currentIndex={blocks.findIndex((x) => !x.done)}
              block={b}
              state={blocks[i]}
              now={now}
              onToggle={() => toggleOpen(i)}
              onChangeFormat={(fmt) => changeFormat(i, fmt)}
              onPatch={(patch) => patchBloc(i, patch)}
              onStart={() => startTimer(i)}
              onCancelCountdown={() => cancelCountdown(i)}
              onPause={() => pauseTimer(i)}
              onReset={() => resetTimer(i)}
              onDone={() => doneBloc(i)}
              onToggleChecked={(exIdx) => toggleChecked(i, exIdx)}
              onAddSerie={(exIdx) => addSerie(i, exIdx)}
              onUpdateSerie={(exIdx, serieIdx, patch) => updateSerie(i, exIdx, serieIdx, patch)}
              onRemoveSerie={(exIdx, serieIdx) => removeSerie(i, exIdx, serieIdx)}
              onSetExerciseTime={(exIdx, value) => setExerciseTime(i, exIdx, value)}
            />
          ))}
        </div>
      </div>

      <div className={styles.bottombar}>
        <div className={styles.bbStats}>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>{movementsDone}</div>
            <div className={styles.bbLabel}>Mouvements</div>
          </div>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>
              {doneCount}/{total}
            </div>
            <div className={styles.bbLabel}>Blocs</div>
          </div>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>{fmtMS(globalSec)}</div>
            <div className={styles.bbLabel}>Temps</div>
          </div>
        </div>
        <button className={cx(styles.bbBtn, styles.bbFinish)} onClick={endSession}>
          ⚡ Terminer la séance
        </button>
      </div>
    </div>
  );
}

function BlocCard({
  refCb,
  index,
  currentIndex,
  block,
  state,
  now,
  onToggle,
  onChangeFormat,
  onPatch,
  onStart,
  onCancelCountdown,
  onPause,
  onReset,
  onDone,
  onToggleChecked,
  onAddSerie,
  onUpdateSerie,
  onRemoveSerie,
  onSetExerciseTime,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  index: number;
  currentIndex: number;
  block: DisplayBlock;
  state: BlocState;
  now: number;
  onToggle: () => void;
  onChangeFormat: (fmt: RuntimeFormat) => void;
  onPatch: (patch: Partial<BlocState>) => void;
  onStart: () => void;
  onCancelCountdown: () => void;
  onPause: () => void;
  onReset: () => void;
  onDone: () => void;
  onToggleChecked: (exIdx: number) => void;
  onAddSerie: (exIdx: number) => void;
  onUpdateSerie: (exIdx: number, serieIdx: number, patch: Partial<ExerciseSerie>) => void;
  onRemoveSerie: (exIdx: number, serieIdx: number) => void;
  onSetExerciseTime: (exIdx: number, value: string) => void;
}) {
  const isDone = state.done;
  const isActive = index === currentIndex && !isDone;
  const checkedCount = state.checked.filter(Boolean).length;
  const itemCount = block.items.length;

  return (
    <div ref={refCb} className={cx(styles.bloc, isActive && styles.active, isDone && styles.done, state.open && styles.open)}>
      <div className={styles.blocHeader} onClick={onToggle}>
        <div className={cx(styles.blocNum, isDone ? styles.done : isActive ? styles.cur : styles.pending)}>
          {isDone ? "✓" : block.lettre}
        </div>
        <div className={styles.blocInfo}>
          <div className={styles.blocTitle}>{block.titre}</div>
          <div className={cx(styles.blocBadge, styles[`badge${capitalize(block.badgeCls)}`])}>{block.badge}</div>
        </div>
        <div>{isDone ? <div className={styles.blocCheck}>✓</div> : <div className={styles.blocChevron}>▾</div>}</div>
      </div>
      <div className={styles.blocBody}>
        <TimerZone
          index={index}
          state={state}
          now={now}
          onChangeFormat={onChangeFormat}
          onPatch={onPatch}
          onStart={onStart}
          onCancelCountdown={onCancelCountdown}
          onPause={onPause}
          onReset={onReset}
          onDone={onDone}
        />

        {itemCount > 0 && (
          <div className={styles.blocProgress}>
            <div className={styles.blocProgressLabel}>
              {checkedCount} / {itemCount} mouvements
            </div>
            <div className={styles.blocProgressTrack}>
              <div className={styles.blocProgressFill} style={{ width: `${(checkedCount / itemCount) * 100}%` }} />
            </div>
          </div>
        )}

        <div className={styles.blocItems}>
          {block.items.map((it, j) => {
            const checked = state.checked[j] ?? false;
            return (
              <div key={`${it.movementName}-${j}`} className={cx(checked && styles.itemChecked)}>
                <div className={styles.itemRow}>
                  <button
                    type="button"
                    className={cx(styles.itemCheck, checked && styles.itemCheckOn)}
                    onClick={() => onToggleChecked(j)}
                    aria-label={checked ? `Décocher ${it.name}` : `Cocher ${it.name}`}
                    aria-pressed={checked}
                  >
                    {checked ? "✓" : ""}
                  </button>
                  <div style={{ flex: 1 }}>
                    <SessionItemRow
                      name={it.name}
                      qty={it.qty}
                      detail={it.detail}
                      movementName={it.movementName}
                      videoUrl={it.videoUrl}
                      noVideo={it.noVideo}
                    />
                  </div>
                </div>

                {checked && state.exerciseSeries[j] && (
                  <SerieInput
                    series={state.exerciseSeries[j]}
                    onAdd={() => onAddSerie(j)}
                    onUpdate={(serieIdx, patch) => onUpdateSerie(j, serieIdx, patch)}
                    onRemove={(serieIdx) => onRemoveSerie(j, serieIdx)}
                  />
                )}

                {checked && TIME_RESULT_TYPES.includes(block.type) && (
                  <div className={styles.seriesWrap}>
                    <div className={styles.serieRow}>
                      <span className={styles.serieLabel}>Temps</span>
                      <input
                        className={styles.serieInput}
                        type="text"
                        inputMode="numeric"
                        placeholder="MM:SS"
                        value={state.exerciseTimes[j] ?? ""}
                        onChange={(e) => onSetExerciseTime(j, e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {WOD_RESULT_TYPES.includes(block.type) && (
          <div className={styles.wodResultRow}>
            <div className={styles.wodResultField}>
              <label>Temps</label>
              <input
                type="text"
                placeholder="MM:SS"
                value={state.temps}
                onChange={(e) => onPatch({ temps: e.target.value })}
              />
            </div>
            <div className={styles.wodResultField}>
              <label>Rounds</label>
              <input
                type="text"
                placeholder="—"
                value={state.rounds}
                onChange={(e) => onPatch({ rounds: e.target.value })}
              />
            </div>
            <div className={styles.wodResultField}>
              <label>Reps bonus</label>
              <input
                type="text"
                placeholder="—"
                value={state.score}
                onChange={(e) => onPatch({ score: e.target.value })}
              />
            </div>
          </div>
        )}
        {block.note && <div className={styles.blocNote}>{block.note}</div>}
        {isDone && (
          <div className={styles.blocDoneOverlay}>
            <span>✅ Bloc complété</span>
            <span className={styles.bdoTime}>{fmtMS(state.finalSec)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SerieInput({
  series,
  onAdd,
  onUpdate,
  onRemove,
}: {
  series: ExerciseSerie[];
  onAdd: () => void;
  onUpdate: (serieIdx: number, patch: Partial<ExerciseSerie>) => void;
  onRemove: (serieIdx: number) => void;
}) {
  return (
    <div className={styles.seriesWrap}>
      {series.map((s, k) => (
        <div key={k} className={styles.serieRow}>
          <span className={styles.serieLabel}>Série {k + 1}</span>
          <input
            className={styles.serieInput}
            type="number"
            inputMode="decimal"
            placeholder="—"
            value={s.charge}
            onChange={(e) => onUpdate(k, { charge: e.target.value })}
          />
          <span className={styles.serieUnit}>kg</span>
          <span>×</span>
          <input
            className={styles.serieInput}
            type="number"
            inputMode="numeric"
            placeholder="—"
            value={s.reps}
            onChange={(e) => onUpdate(k, { reps: e.target.value })}
          />
          <span className={styles.serieUnit}>reps</span>
          {series.length > 1 && (
            <button type="button" className={styles.removeSerieBtn} onClick={() => onRemove(k)}>
              ✕
            </button>
          )}
        </div>
      ))}
      <button type="button" className={styles.addSerieBtn} onClick={onAdd}>
        + Ajouter une série
      </button>
    </div>
  );
}

/** Molette −/+ des réglages Tabata (travail, repos, tours). */
function Stepper({
  label,
  value,
  unit,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.stepBtn} onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <div className={styles.stepValue}>
        {value}
        {unit}
      </div>
      <button type="button" className={styles.stepBtn} onClick={() => onChange(Math.min(max, value + step))}>
        +
      </button>
      <div className={styles.stepLabel}>{label}</div>
    </div>
  );
}

function TimerZone({
  index,
  state: t,
  now,
  onChangeFormat,
  onPatch,
  onStart,
  onCancelCountdown,
  onPause,
  onReset,
  onDone,
}: {
  index: number;
  state: BlocState;
  now: number;
  onChangeFormat: (fmt: RuntimeFormat) => void;
  onPatch: (patch: Partial<BlocState>) => void;
  onStart: () => void;
  onCancelCountdown: () => void;
  onPause: () => void;
  onReset: () => void;
  onDone: () => void;
}) {
  const fmt = t.format;
  const elapsed = elapsedSec(t, now);
  const countdown = t.countdownEndsAt ? Math.max(0, Math.ceil((t.countdownEndsAt - now) / 1000)) : null;

  let displayTime = "00:00";
  let displayClass = styles.idle;
  let statusText = "⏸ EN ATTENTE";
  let infoText = FORMAT_LABELS[fmt].toUpperCase();

  if (t.done) {
    displayTime = fmtMS(t.finalSec);
    displayClass = styles.doneT;
    statusText = "✅ TERMINÉ";
  } else if (t.running) {
    statusText = "⏱ EN COURS";
    if (fmt === "ft" || fmt === "nft") {
      displayTime = fmtMS(elapsed);
      displayClass = fmt === "ft" ? styles.runningFt : styles.runningNft;
      infoText = fmt === "ft" ? "POUR LE TEMPS" : "SANS CHRONO";
    } else if (fmt === "amrap") {
      displayTime = fmtMS(t.durationMin * 60 - elapsed);
      displayClass = styles.runningAmrap;
      infoText = "TEMPS RESTANT";
    } else if (fmt === "emom") {
      displayTime = fmtMS(60 - (elapsed % 60));
      displayClass = styles.runningEmom;
      infoText = `MINUTE ${Math.min(t.durationMin, Math.floor(elapsed / 60) + 1)} / ${t.durationMin}`;
    } else if (fmt === "tabata") {
      const view = tabataView(t, elapsed);
      displayTime = fmtMS(view.remaining);
      displayClass = view.phase === "work" ? styles.runningTabataWork : styles.runningTabataRest;
      infoText = view.phase === "work" ? "EFFORT" : "REPOS";
    }
  } else if (fmt === "amrap" || fmt === "emom") {
    displayTime = fmtMS(t.durationMin * 60);
  } else if (t.accumulatedMs > 0) {
    displayTime = fmtMS(elapsed);
  }

  const idle = !t.done && !t.running && countdown === null;
  const showFmtSelector = idle;
  const showDurRow = (fmt === "amrap" || fmt === "emom") && idle;
  const showTabataConfig = fmt === "tabata" && idle;
  const tabataRunning = fmt === "tabata" && t.running ? tabataView(t, elapsed) : null;

  return (
    <div className={styles.timerZone}>
      {countdown !== null && (
        <div className={styles.countdown}>
          <div className={styles.countdownNum}>{countdown}</div>
          <div className={styles.countdownLabel}>Départ dans…</div>
          <button type="button" className={styles.countdownCancel} onClick={onCancelCountdown}>
            Annuler
          </button>
        </div>
      )}

      {showFmtSelector && (
        <div className={styles.fmtSelector}>
          {(Object.keys(FORMAT_LABELS) as RuntimeFormat[]).map((k) => (
            <button
              key={k}
              type="button"
              className={cx(styles.fmtBtn, fmt === k && styles[`active${capitalize(k)}`])}
              onClick={() => onChangeFormat(k)}
            >
              {FORMAT_LABELS[k]}
            </button>
          ))}
        </div>
      )}

      {showDurRow && (
        <div className={styles.durInputRow}>
          <span className={styles.durLabel}>Durée</span>
          <input
            className={styles.durInput}
            type="number"
            min={1}
            max={60}
            value={t.durationMin}
            onChange={(e) => onPatch({ durationMin: parseInt(e.target.value, 10) || 10 })}
          />
          <span className={styles.durUnit}>min</span>
        </div>
      )}

      {showTabataConfig && (
        <div className={styles.tabataConfig}>
          <Stepper label="Travail" value={t.workSec} unit="s" step={5} min={5} max={120} onChange={(v) => onPatch({ workSec: v })} />
          <Stepper label="Repos" value={t.restSec} unit="s" step={5} min={5} max={120} onChange={(v) => onPatch({ restSec: v })} />
          <Stepper label="Tours" value={t.tabataRounds} step={1} min={1} max={30} onChange={(v) => onPatch({ tabataRounds: v })} />
        </div>
      )}

      {tabataRunning && (
        <>
          <div className={cx(styles.tabataPhase, tabataRunning.phase === "work" ? styles.work : styles.rest)}>
            {tabataRunning.phase === "work" ? `⚡ EFFORT — ${t.workSec}s` : `😮‍💨 REPOS — ${t.restSec}s`}
          </div>
          <div className={styles.roundCounter}>
            Tour <span>{Math.min(tabataRunning.round, t.tabataRounds)}</span> / {t.tabataRounds}
          </div>
          <div className={styles.emomBarWrap}>
            <div
              className={cx(styles.emomBar, tabataRunning.phase === "work" ? styles.green : styles.orange)}
              style={{
                width: `${
                  tabataRunning.phase === "work"
                    ? ((t.workSec - tabataRunning.remaining) / t.workSec) * 100
                    : ((t.restSec - tabataRunning.remaining) / t.restSec) * 100
                }%`,
              }}
            />
          </div>
        </>
      )}

      <div className={styles.timerDisplay}>
        <div className={cx(styles.tdTime, displayClass)}>{displayTime}</div>
        <div className={styles.tdRight}>
          <div className={styles.tdStatus}>{statusText}</div>
          <div className={styles.tdInfo}>{infoText}</div>
        </div>
      </div>

      {fmt === "emom" && t.running && (
        <div className={styles.emomBarWrap}>
          <div className={cx(styles.emomBar, styles.blue)} style={{ width: `${((elapsed % 60) / 60) * 100}%` }} />
        </div>
      )}

      <div className={styles.timerControls} id={`tc-${index}`}>
        {t.done ? (
          <button className={cx(styles.tcBtn, styles.tcReset)} style={{ flex: "none", width: "100%" }} onClick={onReset}>
            ↺ Refaire
          </button>
        ) : countdown !== null ? (
          <button className={cx(styles.tcBtn, styles.tcPause)} style={{ flex: "none", width: "100%" }} onClick={onCancelCountdown}>
            ⏸ Annuler le départ
          </button>
        ) : !t.running && t.accumulatedMs === 0 ? (
          <>
            <button className={cx(styles.tcBtn, styles.tcStart)} onClick={onStart}>
              ▷ Démarrer
            </button>
            <button className={cx(styles.tcBtn, styles.tcDone)} onClick={onDone}>
              ✓ Terminer
            </button>
          </>
        ) : t.running ? (
          <>
            <button className={cx(styles.tcBtn, styles.tcPause)} onClick={onPause}>
              ⏸ Pause
            </button>
            <button className={cx(styles.tcBtn, styles.tcReset)} onClick={onReset}>
              ↺
            </button>
            <button className={cx(styles.tcBtn, styles.tcDone)} onClick={onDone}>
              ✓ Fin
            </button>
          </>
        ) : (
          <>
            <button className={cx(styles.tcBtn, styles.tcStart)} onClick={onStart}>
              ▷ Reprendre
            </button>
            <button className={cx(styles.tcBtn, styles.tcReset)} onClick={onReset}>
              ↺
            </button>
            <button className={cx(styles.tcBtn, styles.tcDone)} onClick={onDone}>
              ✓ Fin
            </button>
          </>
        )}
      </div>
    </div>
  );
}
