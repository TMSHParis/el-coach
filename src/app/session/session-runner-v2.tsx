"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DisplayBlock } from "@/lib/session-format";
import styles from "./session.module.css";
import { SessionItemRow } from "../dashboard/session-item-row";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

type RuntimeFormat = "nft" | "ft" | "amrap" | "emom" | "tabata";

const FORMAT_LABELS: Record<RuntimeFormat, string> = {
  nft: "Not For Time",
  ft: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  tabata: "Tabata",
};

const TABATA_WORK = 20;
const TABATA_REST = 10;

type BlocState = {
  sec: number;
  running: boolean;
  done: boolean;
  finalTime: string;
  format: RuntimeFormat;
  durationMin: number;
  tabataRounds: number;
  tabataPhase: "work" | "rest";
  tabataRound: number;
  tabataSec: number;
  open: boolean;
};

function fmtMS(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtHMS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function vibrate(pattern: number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
}

export function SessionRunnerV2({
  sessionName,
  sessionMeta,
  blocks: blockData,
  initial,
}: {
  sessionName: string;
  sessionMeta: string;
  blocks: DisplayBlock[];
  initial: { format: RuntimeFormat; durationMin: number; tabataRounds: number }[];
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<BlocState[]>(() =>
    initial.map((cfg, i) => ({
      sec: 0,
      running: false,
      done: false,
      finalTime: "",
      format: cfg.format,
      durationMin: cfg.durationMin,
      tabataRounds: cfg.tabataRounds,
      tabataPhase: "work",
      tabataRound: 1,
      tabataSec: TABATA_WORK,
      open: i === 0,
    })),
  );
  const [globalSec, setGlobalSec] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const intervalsRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});
  const blocRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Chrono global
  useEffect(() => {
    if (sessionDone) return;
    const id = setInterval(() => setGlobalSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [sessionDone]);

  // Wake lock — écran allumé pendant la séance
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    (async () => {
      try {
        if ("wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock non supporté ou refusé — pas bloquant.
      }
    })();
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  // Nettoyage des intervalles au démontage
  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      Object.values(intervals).forEach((id) => clearInterval(id));
    };
  }, []);

  function clearBlocInterval(i: number) {
    const id = intervalsRef.current[i];
    if (id) {
      clearInterval(id);
      delete intervalsRef.current[i];
    }
  }

  function startTimer(i: number) {
    const b = blocks[i];
    if (b.running || b.done) return;
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, running: true } : x)));

    intervalsRef.current[i] = setInterval(() => {
      setBlocks((prev) => {
        const next = [...prev];
        const t = { ...next[i] };
        const fmt = t.format;

        if (fmt === "nft" || fmt === "ft") {
          t.sec++;
        } else if (fmt === "amrap") {
          t.sec++;
          if (t.sec >= t.durationMin * 60) {
            finishBloc(i, t);
            next[i] = t;
            return next;
          }
        } else if (fmt === "emom") {
          t.sec++;
          if (t.sec >= t.durationMin * 60) {
            finishBloc(i, t);
            next[i] = t;
            return next;
          }
          if (t.sec % 60 === 0) vibrate([100, 50, 100]);
        } else if (fmt === "tabata") {
          t.tabataSec--;
          if (t.tabataSec <= 0) {
            if (t.tabataPhase === "work") {
              t.tabataPhase = "rest";
              t.tabataSec = TABATA_REST;
              vibrate([50, 30, 50]);
            } else {
              t.tabataRound++;
              if (t.tabataRound > t.tabataRounds) {
                finishBloc(i, t);
                next[i] = t;
                return next;
              }
              t.tabataPhase = "work";
              t.tabataSec = TABATA_WORK;
              vibrate([100, 50, 100]);
            }
          }
        }
        next[i] = t;
        return next;
      });
    }, 1000);
  }

  /** Marque un bloc terminé (appelé depuis le tick pour auto-finish, ou depuis le bouton). Mute `t` en place. */
  function finishBloc(i: number, t: BlocState) {
    clearBlocInterval(i);
    t.running = false;
    t.done = true;
    t.finalTime = fmtMS(t.sec);
    vibrate([200, 100, 200, 100, 400]);
  }

  function pauseTimer(i: number) {
    clearBlocInterval(i);
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, running: false } : x)));
  }

  function resetTimer(i: number) {
    clearBlocInterval(i);
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i
          ? { ...x, sec: 0, running: false, done: false, finalTime: "", tabataPhase: "work", tabataRound: 1, tabataSec: TABATA_WORK }
          : x,
      ),
    );
  }

  function doneBloc(i: number) {
    clearBlocInterval(i);
    setBlocks((prev) =>
      prev.map((x, idx) => (idx === i ? { ...x, running: false, done: true, finalTime: fmtMS(x.sec) } : x)),
    );
    vibrate([50, 30, 80]);
  }

  function changeFormat(i: number, fmt: RuntimeFormat) {
    clearBlocInterval(i);
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i
          ? { ...x, format: fmt, sec: 0, running: false, tabataPhase: "work", tabataRound: 1, tabataSec: TABATA_WORK }
          : x,
      ),
    );
  }

  function setDurationMin(i: number, val: number) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, durationMin: val || 10 } : x)));
  }

  function setTabataRounds(i: number, val: number) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, tabataRounds: val || 8 } : x)));
  }

  function toggleOpen(i: number) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, open: !x.open } : x)));
  }

  function openBloc(i: number) {
    setBlocks((prev) => prev.map((x, idx) => ({ ...x, open: idx === i ? true : x.open })));
    setTimeout(() => {
      blocRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const doneCount = blocks.filter((b) => b.done).length;
  const total = blocks.length;

  // Passe au bloc suivant quand un bloc se termine (auto-finish ou bouton) + détecte la fin de séance.
  const prevDoneRef = useRef<boolean[]>(blocks.map((b) => b.done));
  useEffect(() => {
    const prevDone = prevDoneRef.current;
    blocks.forEach((b, i) => {
      if (b.done && !prevDone[i]) {
        const nextIdx = i + 1;
        if (nextIdx < blocks.length && !blocks[nextIdx].done) {
          openBloc(nextIdx);
        }
      }
    });
    prevDoneRef.current = blocks.map((b) => b.done);
    if (blocks.every((b) => b.done) && !sessionDone) {
      setTimeout(() => setSessionDone(true), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  function nextBloc() {
    if (blocks.every((b) => b.done)) {
      setSessionDone(true);
      return;
    }
    const next = blocks.findIndex((b) => !b.done);
    if (next >= 0) openBloc(next);
  }

  function confirmBack() {
    if (sessionDone) {
      router.push("/dashboard");
      return;
    }
    if (window.confirm("Quitter la séance ?")) {
      Object.values(intervalsRef.current).forEach((id) => clearInterval(id));
      router.push("/dashboard");
    }
  }

  if (sessionDone) {
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
                {doneCount}/{total}
              </div>
              <div className={styles.ssLabel}>Blocs</div>
            </div>
            <div className={styles.ssCard}>
              <div className={styles.ssVal}>—</div>
              <div className={styles.ssLabel}>PR jour</div>
            </div>
          </div>
          <a href="/dashboard" className={styles.successBtn}>
            Retour au dashboard →
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
              onToggle={() => toggleOpen(i)}
              onChangeFormat={(fmt) => changeFormat(i, fmt)}
              onSetDuration={(v) => setDurationMin(i, v)}
              onSetRounds={(v) => setTabataRounds(i, v)}
              onStart={() => startTimer(i)}
              onPause={() => pauseTimer(i)}
              onReset={() => resetTimer(i)}
              onDone={() => doneBloc(i)}
            />
          ))}
        </div>
      </div>

      <div className={styles.bottombar}>
        <div className={styles.bbStats}>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>{doneCount}</div>
            <div className={styles.bbLabel}>Faits</div>
          </div>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>{total}</div>
            <div className={styles.bbLabel}>Blocs</div>
          </div>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>{fmtMS(globalSec)}</div>
            <div className={styles.bbLabel}>Temps</div>
          </div>
        </div>
        <button
          className={cx(styles.bbBtn, doneCount === total ? styles.bbFinish : styles.bbNext)}
          onClick={nextBloc}
        >
          {doneCount === total ? "⚡ Terminer la séance" : "Bloc suivant →"}
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
  onToggle,
  onChangeFormat,
  onSetDuration,
  onSetRounds,
  onStart,
  onPause,
  onReset,
  onDone,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  index: number;
  currentIndex: number;
  block: DisplayBlock;
  state: BlocState;
  onToggle: () => void;
  onChangeFormat: (fmt: RuntimeFormat) => void;
  onSetDuration: (v: number) => void;
  onSetRounds: (v: number) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onDone: () => void;
}) {
  const isDone = state.done;
  const isActive = index === currentIndex && !isDone;

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
          onChangeFormat={onChangeFormat}
          onSetDuration={onSetDuration}
          onSetRounds={onSetRounds}
          onStart={onStart}
          onPause={onPause}
          onReset={onReset}
          onDone={onDone}
        />
        <div className={styles.blocItems}>
          {block.items.map((it, j) => (
            <SessionItemRow
              key={`${it.movementName}-${j}`}
              name={it.name}
              qty={it.qty}
              detail={it.detail}
              movementName={it.movementName}
              videoUrl={it.videoUrl}
            />
          ))}
        </div>
        {block.note && <div className={styles.blocNote}>{block.note}</div>}
        {isDone && (
          <div className={styles.blocDoneOverlay}>
            <span>✅ Bloc complété</span>
            <span className={styles.bdoTime}>{state.finalTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function TimerZone({
  index,
  state: t,
  onChangeFormat,
  onSetDuration,
  onSetRounds,
  onStart,
  onPause,
  onReset,
  onDone,
}: {
  index: number;
  state: BlocState;
  onChangeFormat: (fmt: RuntimeFormat) => void;
  onSetDuration: (v: number) => void;
  onSetRounds: (v: number) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onDone: () => void;
}) {
  const fmt = t.format;

  let displayTime = "00:00";
  let displayClass = styles.idle;
  let statusText = "⏸ EN ATTENTE";
  let infoText = FORMAT_LABELS[fmt].toUpperCase();

  if (t.done) {
    displayTime = t.finalTime;
    displayClass = styles.doneT;
    statusText = "✅ TERMINÉ";
  } else if (t.running) {
    statusText = "⏱ EN COURS";
    if (fmt === "ft" || fmt === "nft") {
      displayTime = fmtMS(t.sec);
      displayClass = fmt === "ft" ? styles.runningFt : styles.runningNft;
      infoText = fmt === "ft" ? "POUR LE TEMPS" : "SANS CHRONO";
    } else if (fmt === "amrap") {
      const remaining = t.durationMin * 60 - t.sec;
      displayTime = fmtMS(Math.max(0, remaining));
      displayClass = styles.runningAmrap;
      infoText = "TEMPS RESTANT";
    } else if (fmt === "emom") {
      const minuteSec = 60 - (t.sec % 60);
      displayTime = fmtMS(minuteSec === 60 ? 0 : minuteSec);
      displayClass = styles.runningEmom;
      infoText = `MIN ${Math.floor(t.sec / 60) + 1} / ${t.durationMin}`;
    } else if (fmt === "tabata") {
      displayTime = fmtMS(t.tabataSec);
      displayClass = t.tabataPhase === "work" ? styles.runningTabataWork : styles.runningTabataRest;
      infoText = t.tabataPhase === "work" ? "EFFORT" : "REPOS";
    }
  } else if (fmt === "amrap" || fmt === "emom") {
    displayTime = fmtMS(t.durationMin * 60);
  }

  const showFmtSelector = !t.done && !t.running;
  const showDurRow = (fmt === "amrap" || fmt === "emom") && !t.running && !t.done;
  const showTabataConfig = fmt === "tabata" && !t.running && !t.done;
  const showEmomBar = fmt === "emom" && t.running;
  const showTabataExtras = fmt === "tabata" && t.running;

  return (
    <div className={styles.timerZone}>
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
            onChange={(e) => onSetDuration(parseInt(e.target.value, 10))}
          />
          <span className={styles.durUnit}>min</span>
        </div>
      )}

      {showTabataConfig && (
        <div className={styles.durInputRow}>
          <span className={styles.durLabel}>Rounds</span>
          <input
            className={styles.roundsInput}
            type="number"
            min={1}
            max={20}
            value={t.tabataRounds}
            onChange={(e) => onSetRounds(parseInt(e.target.value, 10))}
          />
          <span className={styles.durUnit}>rounds · 20s/10s</span>
        </div>
      )}

      {showTabataExtras && (
        <>
          <div className={cx(styles.tabataPhase, t.tabataPhase === "work" ? styles.work : styles.rest)}>
            {t.tabataPhase === "work" ? "⚡ EFFORT — 20s" : "😮‍💨 REPOS — 10s"}
          </div>
          <div className={styles.roundCounter}>
            Round <span>{t.tabataRound}</span> / {t.tabataRounds}
          </div>
          <div className={styles.emomBarWrap}>
            <div
              className={cx(styles.emomBar, t.tabataPhase === "work" ? styles.green : styles.orange)}
              style={{
                width: `${
                  t.tabataPhase === "work"
                    ? ((TABATA_WORK - t.tabataSec) / TABATA_WORK) * 100
                    : ((TABATA_REST - t.tabataSec) / TABATA_REST) * 100
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

      {showEmomBar && (
        <div className={styles.emomBarWrap}>
          <div className={cx(styles.emomBar, styles.blue)} style={{ width: `${((t.sec % 60) / 60) * 100}%` }} />
        </div>
      )}

      <div className={styles.timerControls} id={`tc-${index}`}>
        {t.done ? (
          <button className={cx(styles.tcBtn, styles.tcReset)} style={{ flex: "none", width: "100%" }} onClick={onReset}>
            ↺ Refaire
          </button>
        ) : !t.running && t.sec === 0 ? (
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
