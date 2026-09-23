"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DisplayBlock } from "@/lib/session-format";
import type { BlockType } from "@/lib/programming";
import styles from "./session.module.css";
import { SessionItemRow } from "../dashboard/session-item-row";
import { saveSessionResult, updateSessionRecap, type SessionBlocResult } from "./actions";
import { SessionPhotos } from "@/components/session-photos";
import type { LastResult } from "@/lib/last-results";
import {
  getVolume,
  releaseAudio,
  setVolume,
  soundRest,
  soundStrong,
  soundTick,
  soundTransition,
  soundTriple,
  soundWork,
  speakEn,
  unlockAudio,
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

/** Fond du chrono plein écran selon le format (Tabata : selon la phase). */
const FS_BACKGROUND: Record<RuntimeFormat, string> = {
  amrap: "rgba(249,115,22,0.15)",
  ft: "rgba(239,68,68,0.15)",
  emom: "rgba(59,130,246,0.15)",
  tabata: "rgba(239,68,68,0.15)",
  nft: "rgba(107,114,128,0.15)",
};
const TICK_MS = 200;

/** Blocs où la saisie se fait par exercice (charge × reps, plusieurs séries). */
const SERIES_RESULT_TYPES: BlockType[] = ["strength", "accessory", "skill"];
/** Blocs où la saisie se fait une fois pour tout le bloc (temps/rounds/reps bonus). */
const WOD_RESULT_TYPES: BlockType[] = ["wod", "conditioning"];
/** Blocs cardio : un temps par exercice. */
const TIME_RESULT_TYPES: BlockType[] = ["endurance"];

type ExerciseSerie = { charge: string; reps: string; rpe?: string };

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
  /** Rounds comptés en direct pendant un AMRAP (bouton "+ Round"). */
  amrapRounds: number;
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
  lastResults = {},
  initialPhotos = [],
  photosEnabled = false,
}: {
  sessionName: string;
  sessionMeta: string;
  blocks: DisplayBlock[];
  initial: { format: RuntimeFormat; durationMin: number; tabataRounds: number }[];
  date: string;
  variant: "A" | "B";
  /** Dernier résultat connu par mouvement — rappel et charge suggérée. */
  lastResults?: Record<string, LastResult>;
  /** Photos déjà enregistrées pour la séance du jour. */
  initialPhotos?: string[];
  /** Vercel Blob configuré — sinon le bouton photo reste masqué. */
  photosEnabled?: boolean;
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
          amrapRounds: 0,
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
  /** Bloc affiché en chrono plein écran (null = liste des mouvements). */
  const [fullscreen, setFullscreen] = useState<number | null>(null);
  const [volume, setVolumeState] = useState(0.8);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const blocRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const savedRef = useRef(false);

  useEffect(() => {
    setVolumeState(getVolume());
    return () => releaseAudio();
  }, []);

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
  /** Annonces déjà passées (mi-temps, 10 s...) — une seule fois par bloc. */
  const spokenRef = useRef<Record<number, Set<string>>>({});

  useEffect(() => {
    blocks.forEach((b, i) => {
      const spoken = (spokenRef.current[i] ??= new Set<string>());
      const once = (key: string, fn: () => void) => {
        if (spoken.has(key)) return;
        spoken.add(key);
        fn();
      };
      /** Bip imposant une seule fois par seconde restante (3 · 2 · 1). */
      const beepSecond = (secondsLeft: number) => {
        if (tickRef.current[i] === secondsLeft) return;
        tickRef.current[i] = secondsLeft;
        soundStrong();
        vibrate([60]);
      };
      /** Alerte des 10 dernières secondes — une fois par `key` (par minute sur l'EMOM). */
      const tenSeconds = (key: string) => once(key, () => speakEn("Ten seconds!"));
      /** Fin d'un chrono : 3 bips imposants, vibration longue et annonce. */
      const finish = (phrase: string) => {
        soundTriple();
        speakEn(phrase);
        vibrate([600]);
      };

      if (b.countdownEndsAt) {
        const remaining = Math.ceil((b.countdownEndsAt - now) / 1000);
        if (remaining <= 0) {
          tickRef.current[i] = -1;
          // Les 3 bips imposants viennent d'être joués (3 · 2 · 1) — la voix suit.
          speakEn("Let's Go!");
          vibrate([400]);
          setFullscreen(i);
          setBlocks((prev) =>
            prev.map((x, idx) =>
              idx === i ? { ...x, countdownEndsAt: null, running: true, startedAt: Date.now() } : x,
            ),
          );
          return;
        }
        if (remaining <= 3) beepSecond(remaining);
        return;
      }

      if (!b.running || b.done) return;
      const elapsed = elapsedSec(b, now);

      if (b.format === "amrap") {
        const total = b.durationMin * 60;
        const remaining = total - elapsed;
        if (remaining <= 0) {
          finish("Time's up!");
          finishBloc(i, total);
          return;
        }
        if (elapsed >= Math.floor(total / 2)) once("half", () => speakEn("Half Time!"));
        if (remaining <= 10) tenSeconds("ten");
        if (remaining <= 3) beepSecond(remaining);
        return;
      }

      if (b.format === "ft") {
        // Pas de fin imposée : les repères sont calés sur la durée estimée du bloc.
        const estimated = b.durationMin * 60;
        if (estimated <= 0) return;
        const remaining = estimated - elapsed;
        if (elapsed >= Math.floor(estimated / 2)) once("half", () => speakEn("Half Time!"));
        if (remaining <= 10 && remaining > 0) tenSeconds("ten");
        if (remaining <= 3 && remaining > 0) beepSecond(remaining);
        return;
      }

      if (b.format === "emom") {
        const total = b.durationMin * 60;
        if (elapsed >= total) {
          finish("Well done!");
          finishBloc(i, total);
          return;
        }
        const minute = Math.floor(elapsed / 60) + 1;
        const secondsLeftInMinute = 60 - (elapsed % 60);
        // Une alerte des 10 s et un compte à rebours par minute.
        if (secondsLeftInMinute <= 10) tenSeconds(`ten-${minute}`);
        if (secondsLeftInMinute <= 3) beepSecond(secondsLeftInMinute);
        if (minuteRef.current[i] === undefined) minuteRef.current[i] = minute;
        else if (minute !== minuteRef.current[i]) {
          minuteRef.current[i] = minute;
          tickRef.current[i] = -1;
          soundTransition();
          vibrate([120]);
          // Mouvements pas tous cochés à la fin de la minute → on le signale au lieu du round.
          const allChecked = b.checked.length > 0 && b.checked.every(Boolean);
          speakEn(allChecked ? `Let's Go! Round ${minute}` : "Next round!");
        }
        return;
      }

      if (b.format === "tabata") {
        const view = tabataView(b, elapsed);
        if (view.finished) {
          finish("Well done!");
          finishBloc(i, b.tabataRounds * (b.workSec + b.restSec));
          return;
        }
        // Bips sur les 3 dernières secondes, aussi bien en travail qu'en repos.
        if (view.remaining <= 3) beepSecond(view.remaining);
        // Mi-temps de la phase travail : un bip sec.
        if (view.phase === "work" && view.remaining <= Math.ceil(b.workSec / 2)) {
          once(`half-${view.round}`, () => soundTick());
        }
        // Dernier tour annoncé pendant le repos qui le précède.
        if (view.phase === "rest" && view.round === b.tabataRounds - 1) {
          once("last-round", () => speakEn("Last round!"));
        }
        const key = `${view.round}-${view.phase}`;
        if (tabataRef.current[i] === undefined) tabataRef.current[i] = key;
        else if (tabataRef.current[i] !== key) {
          tabataRef.current[i] = key;
          tickRef.current[i] = -1;
          vibrate([120]);
          if (view.phase === "work") {
            soundWork();
            speakEn(`Round ${view.round}`);
          } else {
            soundRest();
            speakEn("Rest!");
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function startTimer(i: number) {
    unlockAudio(); // geste utilisateur : seul moment où iOS autorise le son
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
    delete spokenRef.current[i];
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
      // Fin d'un For Time : les 3 bips imposants, puis le temps réalisé.
      soundTriple();
      speakEn(`Well done! Time: ${Math.floor(sec / 60)} minutes ${sec % 60}`);
      vibrate([600]);
    } else {
      soundTransition();
      vibrate([80]);
    }
    setFullscreen(null);
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

  /** AMRAP : un tap = un round complété (compté en direct, repris dans les résultats). */
  function addAmrapRound(i: number) {
    soundTransition();
    vibrate([60]);
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i ? { ...x, amrapRounds: x.amrapRounds + 1, rounds: String(x.amrapRounds + 1) } : x,
      ),
    );
  }

  /** Photos ajoutées pendant la séance — enregistrées tout de suite (upsert). */
  function changePhotos(next: string[]) {
    setPhotos(next);
    void updateSessionRecap(date, { photos: next });
  }

  function changeVolume(value: number) {
    setVolumeState(value);
    setVolume(value);
  }

  function toggleChecked(blocIdx: number, exIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx ? { ...x, checked: x.checked.map((c, j) => (j === exIdx ? !c : c)) } : x,
      ),
    );
    vibrate([30]);
  }

  /** Nouvelle série pré-remplie avec les valeurs de la précédente. */
  function addSerie(blocIdx: number, exIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? {
              ...x,
              exerciseSeries: x.exerciseSeries.map((es, j) => {
                if (j !== exIdx) return es;
                const last = es[es.length - 1];
                return [...es, { charge: last?.charge ?? "", reps: last?.reps ?? "", rpe: last?.rpe }];
              }),
            }
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

  // Enregistrement des résultats puis compte rendu — best effort : même si
  // l'enregistrement échoue, on emmène l'athlète sur la page de compte rendu.
  useEffect(() => {
    if (!sessionDone || savedRef.current) return;
    savedRef.current = true;
    const blocs: SessionBlocResult[] = [];
    blockData.forEach((b, i) => {
      const state = blocks[i];
      b.items.forEach((it, j) => {
        const series = (state.exerciseSeries[j] ?? []).filter((x) => x.charge.trim() || x.reps.trim());
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

    releaseAudio();
    saveSessionResult({ date, variant, blocs, durationSec: globalSec, completionRate })
      .catch(() => {})
      .finally(() => router.replace("/session/recap"));
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Rien à nettoyer si le stockage est indisponible.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDone]);

  if (sessionDone) {
    // Le compte rendu complet vit sur /session/recap (généré côté serveur) —
    // ici on patiente pendant l'enregistrement et la génération du message.
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
            {fmtHMS(globalSec)} · {movementsDone}/{movementsTotal} mouvements
          </div>
          <div className={styles.successSub}>Préparation de ton compte rendu…</div>
        </div>
      </div>
    );
  }

  const fsIndex = fullscreen !== null && blocks[fullscreen] && !blocks[fullscreen].done ? fullscreen : null;

  return (
    <div className={styles.sessRoot}>
      {fsIndex !== null && (
        <FullscreenTimer
          block={blockData[fsIndex]}
          state={blocks[fsIndex]}
          now={now}
          globalLabel={fmtHMS(globalSec)}
          onPause={() => pauseTimer(fsIndex)}
          onResume={() => startTimer(fsIndex)}
          onAddRound={() => addAmrapRound(fsIndex)}
          onDone={() => doneBloc(fsIndex)}
          onClose={() => setFullscreen(null)}
        />
      )}
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
          <label className={styles.volumeRow}>
            <span className={styles.volumeLabel}>🔊 Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => changeVolume(Number(e.target.value) / 100)}
              className={styles.volumeSlider}
              aria-label="Volume des signaux sonores"
            />
            <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
          </label>
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
              lastResults={lastResults}
              onToggle={() => toggleOpen(i)}
              onChangeFormat={(fmt) => changeFormat(i, fmt)}
              onPatch={(patch) => patchBloc(i, patch)}
              onStart={() => startTimer(i)}
              onCancelCountdown={() => cancelCountdown(i)}
              onPause={() => pauseTimer(i)}
              onReset={() => resetTimer(i)}
              onDone={() => doneBloc(i)}
              onAddRound={() => addAmrapRound(i)}
              onOpenFullscreen={() => setFullscreen(i)}
              onToggleChecked={(exIdx) => toggleChecked(i, exIdx)}
              onAddSerie={(exIdx) => addSerie(i, exIdx)}
              onUpdateSerie={(exIdx, serieIdx, patch) => updateSerie(i, exIdx, serieIdx, patch)}
              onRemoveSerie={(exIdx, serieIdx) => removeSerie(i, exIdx, serieIdx)}
              onSetExerciseTime={(exIdx, value) => setExerciseTime(i, exIdx, value)}
            />
          ))}
        </div>

        {photosEnabled && (
          <div className={styles.photoBar}>
            <div className={styles.photoBarLabel}>Photos de la séance (2 max)</div>
            <SessionPhotos photos={photos} onChange={changePhotos} />
          </div>
        )}
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
  lastResults,
  onToggle,
  onChangeFormat,
  onPatch,
  onStart,
  onCancelCountdown,
  onPause,
  onReset,
  onDone,
  onAddRound,
  onOpenFullscreen,
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
  lastResults: Record<string, LastResult>;
  onToggle: () => void;
  onChangeFormat: (fmt: RuntimeFormat) => void;
  onPatch: (patch: Partial<BlocState>) => void;
  onStart: () => void;
  onCancelCountdown: () => void;
  onPause: () => void;
  onReset: () => void;
  onDone: () => void;
  onAddRound: () => void;
  onOpenFullscreen: () => void;
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
          onAddRound={onAddRound}
          onOpenFullscreen={onOpenFullscreen}
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
                    last={lastResults[it.name] ?? lastResults[it.movementName]}
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
  last,
  onAdd,
  onUpdate,
  onRemove,
}: {
  series: ExerciseSerie[];
  last?: LastResult;
  onAdd: () => void;
  onUpdate: (serieIdx: number, patch: Partial<ExerciseSerie>) => void;
  onRemove: (serieIdx: number) => void;
}) {
  return (
    <div className={styles.seriesWrap}>
      {series.map((s, k) => (
        <div key={k}>
        <div className={styles.serieRow}>
          <span className={styles.serieLabel}>Série {k + 1}</span>
          <input
            className={styles.serieInput}
            type="number"
            inputMode="decimal"
            placeholder={last ? String(last.suggestion) : "—"}
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
        <div className={styles.rpeRow}>
          <span className={styles.rpeLabel}>RPE {s.rpe || "—"}</span>
          <input
            className={styles.rpeSlider}
            type="range"
            min={1}
            max={10}
            step={1}
            value={s.rpe ? Number(s.rpe) : 5}
            onChange={(e) => onUpdate(k, { rpe: e.target.value })}
            aria-label={`RPE série ${k + 1}`}
          />
          <span className={styles.rpeHint}>facultatif</span>
        </div>
        </div>
      ))}
      {last && (
        <div className={styles.lastResult}>
          Dernière fois : {last.charge} kg × {last.reps || "—"} · suggéré {last.suggestion} kg
        </div>
      )}
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
  onAddRound,
  onOpenFullscreen,
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
  onAddRound: () => void;
  onOpenFullscreen: () => void;
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
  } else if (t.accumulatedMs > 0) {
    // Chrono en pause : on garde le temps atteint sous les yeux.
    displayTime =
      fmt === "amrap" ? fmtMS(t.durationMin * 60 - elapsed) : fmt === "emom" ? fmtMS(60 - (elapsed % 60)) : fmtMS(elapsed);
    statusText = "⏸ EN PAUSE";
    displayClass = styles.paused;
  } else if (fmt === "amrap" || fmt === "emom") {
    displayTime = fmtMS(t.durationMin * 60);
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

      {fmt === "emom" && t.running && (
        <div className={styles.roundCounter}>
          Round <span>{Math.min(t.durationMin, Math.floor(elapsed / 60) + 1)}</span> / {t.durationMin}
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

      {t.running && fmt === "amrap" && (
        <button type="button" className={styles.roundBtn} onClick={onAddRound}>
          + Round <span>{t.amrapRounds}</span>
        </button>
      )}

      {t.running && (
        <button type="button" className={styles.fsOpenBtn} onClick={onOpenFullscreen}>
          ⛶ Chrono plein écran
        </button>
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


/** Chrono plein écran pendant un bloc en cours — format, temps, infos, pause. */
function FullscreenTimer({
  block,
  state: t,
  now,
  globalLabel,
  onPause,
  onResume,
  onAddRound,
  onDone,
  onClose,
}: {
  block: DisplayBlock;
  state: BlocState;
  now: number;
  globalLabel: string;
  onPause: () => void;
  onResume: () => void;
  onAddRound: () => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const fmt = t.format;
  const elapsed = elapsedSec(t, now);
  const countdown = t.countdownEndsAt ? Math.max(0, Math.ceil((t.countdownEndsAt - now) / 1000)) : null;
  const tabata = fmt === "tabata" ? tabataView(t, elapsed) : null;

  let time = fmtMS(elapsed);
  let info = "";
  if (fmt === "amrap") {
    time = fmtMS(t.durationMin * 60 - elapsed);
    info = `${t.amrapRounds} round${t.amrapRounds > 1 ? "s" : ""} complété${t.amrapRounds > 1 ? "s" : ""}`;
  } else if (fmt === "emom") {
    time = fmtMS(60 - (elapsed % 60));
    info = `Round ${Math.min(t.durationMin, Math.floor(elapsed / 60) + 1)} / ${t.durationMin}`;
  } else if (tabata) {
    time = fmtMS(tabata.remaining);
    info = `${tabata.phase === "work" ? "Travail" : "Repos"} · Round ${Math.min(tabata.round, t.tabataRounds)} / ${t.tabataRounds}`;
  } else if (fmt === "ft") {
    info = "Pour le temps";
  } else {
    info = "Sans chrono";
  }

  // Teinte du format posée sur le noir opaque (sinon la page défile derrière).
  const tint = tabata && tabata.phase === "rest" ? "rgba(34,197,94,0.15)" : FS_BACKGROUND[fmt];

  return (
    <div className={styles.fsRoot} style={{ backgroundImage: `linear-gradient(${tint}, ${tint})` }}>
      <div className={styles.fsTop}>
        <div className={styles.fsFormat}>{FORMAT_LABELS[fmt]}</div>
        <div className={styles.fsBloc}>{block.titre}</div>
      </div>

      <div className={styles.fsCenter}>
        <div className={styles.fsTime}>{countdown !== null ? countdown : time}</div>
        <div className={styles.fsInfo}>{countdown !== null ? "Départ dans…" : info}</div>
        {!t.running && t.accumulatedMs > 0 && countdown === null && <div className={styles.fsPaused}>⏸ En pause</div>}
        {fmt === "amrap" && t.running && (
          <button type="button" className={styles.fsRoundBtn} onClick={onAddRound}>
            + Round
          </button>
        )}
        {fmt === "ft" && t.running && (
          <button type="button" className={styles.fsRoundBtn} onClick={onDone}>
            Done !
          </button>
        )}
      </div>

      <div className={styles.fsBottom}>
        <button type="button" className={styles.fsBtn} onClick={t.running ? onPause : onResume}>
          {t.running ? "⏸ Pause" : "▷ Reprendre"}
        </button>
        <div className={styles.fsGlobal}>{globalLabel}</div>
        <button type="button" className={styles.fsBtn} onClick={onClose}>
          ← Mouvements
        </button>
      </div>
    </div>
  );
}
