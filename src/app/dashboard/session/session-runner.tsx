"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  MoreHorizontal,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  Video,
  X,
} from "lucide-react";
import {
  formatExerciseLine,
  resolveExerciseMovement,
  type Block,
  type Exercise,
  type WodFormat,
} from "@/lib/programming";
import { BlockHeader } from "@/components/block-header";
import { VideoModal } from "./video-modal";
import { useT } from "@/lib/i18n/provider";

type Props = {
  initialBlocks: Block[];
  templateName: string;
  dayLabel: string;
  focus: string;
  estimatedMinutes: number;
};

type PerfEntry = {
  reps?: number;
  rounds?: number;
  timeSeconds?: number;
  notes?: string;
};

function parseDurationSeconds(input?: string): number | null {
  if (!input) return null;
  const cleaned = input.replace(/sub\s*/i, "").trim();
  const minMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (minMatch) return Math.round(parseFloat(minMatch[1]) * 60);
  const secMatch = cleaned.match(/(\d+)\s*s/i);
  if (secMatch) return parseInt(secMatch[1], 10);
  return null;
}

function formatClock(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? "-" : "";
  return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================================================
// SESSION RUNNER — liste verticale + plein écran swipe horizontal entre blocs
// ============================================================================

export default function SessionRunner({
  initialBlocks,
  templateName,
  dayLabel,
  focus,
  estimatedMinutes,
}: Props) {
  const t = useT();
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [perf, setPerf] = useState<Record<number, PerfEntry>>({});
  const [done, setDone] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setSessionElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  function moveBlock(from: number, to: number) {
    if (to < 0 || to >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setCompleted((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx === from) next.add(to);
        else if (from < to && idx > from && idx <= to) next.add(idx - 1);
        else if (from > to && idx < from && idx >= to) next.add(idx + 1);
        else next.add(idx);
      });
      return next;
    });
    setPerf((prev) => {
      const next: Record<number, PerfEntry> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        let newI = i;
        if (i === from) newI = to;
        else if (from < to && i > from && i <= to) newI = i - 1;
        else if (from > to && i < from && i >= to) newI = i + 1;
        next[newI] = v;
      });
      return next;
    });
  }

  const completeBlock = useCallback((idx: number) => {
    setCompleted((prev) => new Set(prev).add(idx));
  }, []);

  const updatePerf = useCallback((idx: number, patch: Partial<PerfEntry>) => {
    setPerf((prev) => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));
  }, []);

  if (done) {
    return (
      <SessionDoneScreen
        focus={focus}
        sessionElapsed={sessionElapsed}
        blocks={blocks}
        perf={perf}
        completed={completed}
        estimatedMinutes={estimatedMinutes}
      />
    );
  }

  const completedCount = completed.size;
  const totalCount = blocks.length;

  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/dashboard"
          className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
        >
          <ArrowLeft size={14} /> {t("lg.run.leave")}
        </Link>

        <header className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="label">
              [ {templateName.toUpperCase()} · {dayLabel.toUpperCase()} ]
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {focus}
            </h1>
            <div className="mono mt-2 text-xs text-[color:var(--color-mute)]">
              {t("lg.run.blocksDone", { total: totalCount, done: completedCount })}
              {estimatedMinutes > 0 && <>{t("lg.run.estimated", { n: estimatedMinutes })}</>}
            </div>
          </div>
          <div className="card px-4 py-3 text-right">
            <div className="label">{t("lg.run.sessionClock")}</div>
            <div className="mono mt-1 text-2xl font-semibold tabular-nums">
              {formatClock(sessionElapsed)}
            </div>
          </div>
        </header>

        <ProgressBar total={totalCount} completed={completed} activeIdx={focusIdx} />

        <ol className="mt-8 space-y-4">
          {blocks.map((block, i) => (
            <BlockSummary
              key={`${block.name}-${i}`}
              block={block}
              index={i}
              totalCount={totalCount}
              isCompleted={completed.has(i)}
              onOpen={() => setFocusIdx(i)}
              onMoveUp={() => moveBlock(i, i - 1)}
              onMoveDown={() => moveBlock(i, i + 1)}
            />
          ))}
        </ol>

        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <Link href="/dashboard" className="btn-ghost justify-center">
            <ArrowLeft size={14} /> {t("lg.backDashboard")}
          </Link>
          <button onClick={() => setDone(true)} className="btn-primary justify-center">
            {t("lg.run.finish")} <Check size={14} />
          </button>
        </div>
      </section>

      {focusIdx !== null && (
        <BlockFocus
          blocks={blocks}
          index={focusIdx}
          completed={completed}
          perf={perf}
          onClose={() => setFocusIdx(null)}
          onChangeIndex={setFocusIdx}
          onComplete={completeBlock}
          onUpdatePerf={updatePerf}
        />
      )}
    </>
  );
}

function ProgressBar({
  total,
  completed,
  activeIdx,
}: {
  total: number;
  completed: Set<number>;
  activeIdx: number | null;
}) {
  return (
    <div className="mt-8 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = completed.has(i);
        const isActive = activeIdx === i;
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 transition-colors ${
              isDone
                ? "bg-emerald-400"
                : isActive
                  ? "bg-white"
                  : "bg-[color:var(--color-line)]"
            }`}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Carte récap d'un bloc dans la liste verticale (avant tap → plein écran)
// ============================================================================

function BlockSummary({
  block,
  index,
  totalCount,
  isCompleted,
  onOpen,
  onMoveUp,
  onMoveDown,
}: {
  block: Block;
  index: number;
  totalCount: number;
  isCompleted: boolean;
  onOpen: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const t = useT();
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  return (
    <li
      className={`relative card overflow-hidden transition-colors ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full p-5 text-left md:p-6"
        aria-label={t("lg.run.open", { block: t("lg.block", { n: index + 1 }), name: block.name })}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <BlockHeader block={block} index={index} />
          </div>
          {isCompleted && (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-emerald-400">
              <Check size={14} /> {t("lg.run.done")}
            </span>
          )}
        </div>

        <ul className="mt-5 space-y-1.5">
          {block.exercises.map((ex, i) => (
            <ExerciseRow key={`${ex.movementId}-${i}`} exercise={ex} interactive={false} />
          ))}
        </ul>

        {block.notes && (
          <p className="mono mt-4 border-t border-[color:var(--color-line)] pt-3 text-xs text-[color:var(--color-mute)]">
            {block.notes}
          </p>
        )}

        <div className="mono mt-5 flex items-center justify-between border-t border-[color:var(--color-line)] pt-4 text-xs text-[color:var(--color-mute)]">
          <span>{t("lg.run.tapToOpen")}</span>
          <span>
            {t("lg.block", { n: index + 1 })}/{totalCount}
          </span>
        </div>
      </button>

      <div className="absolute right-3 top-3">
        <BlockMenu
          isFirst={isFirst}
          isLast={isLast}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>
    </li>
  );
}

function BlockMenu({
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="border border-[color:var(--color-line)] bg-[color:var(--color-ash)] p-2 text-[color:var(--color-mute)] hover:text-white"
        aria-label={t("lg.run.blockOptions")}
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1 w-48 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[color:var(--color-mute)] hover:bg-black hover:text-white disabled:opacity-30"
          >
            <ArrowUp size={12} /> {t("lg.run.moveUp")}
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[color:var(--color-mute)] hover:bg-black hover:text-white disabled:opacity-30"
          >
            <ArrowDown size={12} /> {t("lg.run.moveDown")}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Bloc en plein écran — swipe gauche/droite + indicateur Bloc X/N
// ============================================================================

function BlockFocus({
  blocks,
  index,
  completed,
  perf,
  onClose,
  onChangeIndex,
  onComplete,
  onUpdatePerf,
}: {
  blocks: Block[];
  index: number;
  completed: Set<number>;
  perf: Record<number, PerfEntry>;
  onClose: () => void;
  onChangeIndex: (i: number) => void;
  onComplete: (i: number) => void;
  onUpdatePerf: (i: number, patch: Partial<PerfEntry>) => void;
}) {
  const t = useT();
  const total = blocks.length;
  const block = blocks[index];
  const isCompleted = completed.has(index);

  const goPrev = useCallback(() => {
    if (index > 0) onChangeIndex(index - 1);
  }, [index, onChangeIndex]);
  const goNext = useCallback(() => {
    if (index < total - 1) onChangeIndex(index + 1);
  }, [index, total, onChangeIndex]);

  // Clavier : ←/→ pour naviguer, Esc pour fermer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  // Swipe horizontal — seuil 50px.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    touchStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  // Verrouille le scroll body pendant le plein écran.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      data-hide-scroll-top
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
        >
          <X size={14} /> {t("lg.run.close")}
        </button>
        <div className="mono text-xs tracking-[0.3em] text-[color:var(--color-mute)]">
          {t("lg.block", { n: index + 1 })} / {total}
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto px-5 py-8">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          aria-label={t("lg.run.prevBlock")}
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] p-2 text-[color:var(--color-mute)] hover:text-white disabled:opacity-30 md:block"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index === total - 1}
          aria-label={t("lg.run.nextBlock")}
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] p-2 text-[color:var(--color-mute)] hover:text-white disabled:opacity-30 md:block"
        >
          <ChevronRight size={18} />
        </button>

        <div className="mx-auto max-w-2xl">
          <BlockHeader block={block} index={index} />

          <ul className="mt-6 space-y-2">
            {block.exercises.map((ex, i) => (
              <ExerciseRow key={`${ex.movementId}-${i}`} exercise={ex} interactive />
            ))}
          </ul>

          {block.notes && (
            <p className="mono mt-5 border-t border-[color:var(--color-line)] pt-4 text-xs text-[color:var(--color-mute)]">
              {block.notes}
            </p>
          )}

          <div className="mt-8 space-y-5">
            <BlockTimer block={block} />
            {!isCooldownOrWarmup(block) && (
              <PerfInput
                block={block}
                perf={perf[index]}
                onChange={(patch) => onUpdatePerf(index, patch)}
              />
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-[color:var(--color-line)] px-5 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="btn-ghost justify-center disabled:opacity-30"
            aria-label={t("lg.run.prevBlock")}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              onComplete(index);
              if (index < total - 1) onChangeIndex(index + 1);
              else onClose();
            }}
            className="btn-primary flex-1 justify-center"
          >
            {isCompleted ? (
              <>
                <Check size={14} /> {t("lg.run.alreadyDone")}
              </>
            ) : (
              <>
                <Check size={14} /> {t("lg.run.blockDone")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index === total - 1}
            className="btn-ghost justify-center disabled:opacity-30"
            aria-label={t("lg.run.nextBlock")}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="mono mt-3 text-center text-[10px] tracking-[0.3em] text-[color:var(--color-mute)]">
          {t("lg.run.swipe", { n: t("lg.block", { n: index + 1 }), total })}
        </div>
      </footer>
    </div>
  );
}

function isCooldownOrWarmup(block: Block): boolean {
  return block.type === "warmup" || block.type === "cooldown";
}

// ============================================================================
// Ligne exercice (avec préfixe ▸ EL COACH METHOD)
// ============================================================================

function ExerciseRow({
  exercise,
  interactive,
}: {
  exercise: Exercise;
  interactive: boolean;
}) {
  const movement = resolveExerciseMovement(exercise);
  const name = movement?.name ?? exercise.movementId;
  const { primary, secondary } = formatExerciseLine(exercise, name);
  const t = useT();
  const [videoOpen, setVideoOpen] = useState(false);

  const content = (
    <>
      <span aria-hidden className="mt-1 select-none text-[color:var(--color-mute)]">▸</span>
      <div className="flex-1">
        <div className="text-base leading-snug">{primary}</div>
        {secondary && (
          <div className="mt-0.5 text-xs text-[color:var(--color-mute)]">{secondary}</div>
        )}
      </div>
    </>
  );

  if (!interactive) {
    return (
      <li className="flex items-start gap-2">
        {content}
      </li>
    );
  }

  return (
    <>
      <li className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          className="flex flex-1 items-start gap-2 text-left hover:underline"
          aria-label={t("lg.run.videoDemo", { name })}
        >
          {content}
        </button>
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          className="mt-1 shrink-0 text-[color:var(--color-mute)] hover:text-white"
          aria-label={t("lg.run.videoDemo", { name })}
          title={t("lg.run.videoDemoTitle")}
        >
          <Video size={16} />
        </button>
      </li>
      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        title={name}
        searchQuery={name}
        videoUrl={movement?.videoUrl}
      />
    </>
  );
}

// ============================================================================
// Timers par format de bloc
// ============================================================================

function BlockTimer({ block }: { block: Block }) {
  const fmt: WodFormat | undefined = block.format;
  const totalSeconds = parseDurationSeconds(block.duration);

  if (!fmt) return null;

  if (fmt === "AMRAP" || fmt === "ForTime") {
    return <CountTimer mode={fmt === "AMRAP" ? "down" : "up"} seconds={totalSeconds} label={fmt} />;
  }

  if (fmt === "EMOM" || fmt === "E2MOM" || fmt === "E3MOM") {
    const intervalSec = fmt === "EMOM" ? 60 : fmt === "E2MOM" ? 120 : 180;
    return <IntervalTimer intervalSec={intervalSec} totalSec={totalSeconds} label={fmt} />;
  }

  if (fmt === "Tabata") {
    return <TabataTimer rounds={block.rounds ?? 8} workSec={20} restSec={10} />;
  }

  if (fmt === "Intervals" || fmt === "Circuit" || fmt === "RFT") {
    return <CountTimer mode="up" seconds={totalSeconds} label={fmt} />;
  }

  return <CountTimer mode="up" seconds={null} label={fmt} />;
}

function useTicker(active: boolean, onTick: () => void) {
  const cb = useRef(onTick);
  useEffect(() => {
    cb.current = onTick;
  }, [onTick]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => cb.current(), 1000);
    return () => clearInterval(id);
  }, [active]);
}

function CountTimer({
  mode,
  seconds,
  label,
}: {
  mode: "up" | "down";
  seconds: number | null;
  label: string;
}) {
  const t = useT();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useTicker(running, () => {
    setElapsed((e) => {
      const next = e + 1;
      if (mode === "down" && seconds !== null && next >= seconds) {
        setRunning(false);
        return seconds;
      }
      return next;
    });
  });

  const display =
    mode === "down" && seconds !== null ? Math.max(0, seconds - elapsed) : elapsed;
  const isOver = mode === "down" && seconds !== null && elapsed >= seconds;

  return (
    <div className="grid gap-3 border border-[color:var(--color-line)] bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="label">{t("lg.run.timer", { label })}</div>
        <div
          className={`mono mt-1 text-5xl font-semibold tabular-nums ${
            isOver ? "text-emerald-400" : ""
          }`}
        >
          {formatClock(display)}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="btn-primary justify-center"
          disabled={isOver}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? t("lg.run.pause") : elapsed === 0 ? t("lg.run.start") : t("lg.run.resume")}
        </button>
        <button
          type="button"
          onClick={() => {
            setElapsed(0);
            setRunning(false);
          }}
          className="btn-ghost justify-center"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

function IntervalTimer({
  intervalSec,
  totalSec,
  label,
}: {
  intervalSec: number;
  totalSec: number | null;
  label: string;
}) {
  const t = useT();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useTicker(running, () => {
    setElapsed((e) => {
      const next = e + 1;
      if (totalSec !== null && next >= totalSec) {
        setRunning(false);
        return totalSec;
      }
      return next;
    });
  });

  const currentInterval = Math.floor(elapsed / intervalSec) + 1;
  const intervalElapsed = elapsed % intervalSec;
  const intervalRemaining = intervalSec - intervalElapsed;
  const totalIntervals = totalSec ? Math.floor(totalSec / intervalSec) : null;
  const isOver = totalSec !== null && elapsed >= totalSec;
  const isNewInterval = intervalElapsed === 0 && elapsed > 0;

  return (
    <div className="grid gap-3 border border-[color:var(--color-line)] bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="label">
          {t("lg.run.timerInterval", { label, n: currentInterval })}
          {totalIntervals && ` / ${totalIntervals}`}
        </div>
        <div
          className={`mono mt-1 text-5xl font-semibold tabular-nums ${
            isNewInterval ? "text-emerald-400" : ""
          }`}
        >
          {formatClock(intervalRemaining)}
        </div>
        {totalSec !== null && (
          <div className="mono mt-1 text-xs text-[color:var(--color-mute)]">
            {t("lg.run.total", { a: formatClock(elapsed), b: formatClock(totalSec) })}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="btn-primary justify-center"
          disabled={isOver}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? t("lg.run.pause") : elapsed === 0 ? t("lg.run.start") : t("lg.run.resume")}
        </button>
        <button
          type="button"
          onClick={() => {
            setElapsed(0);
            setRunning(false);
          }}
          className="btn-ghost justify-center"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

function TabataTimer({
  rounds,
  workSec,
  restSec,
}: {
  rounds: number;
  workSec: number;
  restSec: number;
}) {
  const cycleSec = workSec + restSec;
  const totalSec = cycleSec * rounds;
  const t = useT();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useTicker(running, () => {
    setElapsed((e) => {
      const next = e + 1;
      if (next >= totalSec) {
        setRunning(false);
        return totalSec;
      }
      return next;
    });
  });

  const currentRound = Math.min(rounds, Math.floor(elapsed / cycleSec) + 1);
  const cyclePos = elapsed % cycleSec;
  const isWork = cyclePos < workSec;
  const remaining = isWork ? workSec - cyclePos : cycleSec - cyclePos;
  const isOver = elapsed >= totalSec;

  return (
    <div className="grid gap-3 border border-[color:var(--color-line)] bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="label">
          TABATA · ROUND {currentRound} / {rounds} · {isWork ? t("lg.run.work") : t("lg.run.rest")}
        </div>
        <div
          className={`mono mt-1 text-5xl font-semibold tabular-nums ${
            isWork ? "text-white" : "text-[color:var(--color-mute)]"
          } ${isOver ? "text-emerald-400" : ""}`}
        >
          {formatClock(remaining)}
        </div>
        <div className="mono mt-1 text-xs text-[color:var(--color-mute)]">
          {t("lg.run.tabataLine", { w: workSec, r: restSec, n: rounds })}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="btn-primary justify-center"
          disabled={isOver}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? t("lg.run.pause") : elapsed === 0 ? t("lg.run.start") : t("lg.run.resume")}
        </button>
        <button
          type="button"
          onClick={() => {
            setElapsed(0);
            setRunning(false);
          }}
          className="btn-ghost justify-center"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Saisie performances
// ============================================================================

function PerfInput({
  block,
  perf,
  onChange,
}: {
  block: Block;
  perf?: PerfEntry;
  onChange: (patch: Partial<PerfEntry>) => void;
}) {
  const t = useT();
  const fmt = block.format;
  const showRounds = fmt === "AMRAP";
  const showReps = fmt === "AMRAP" || fmt === "EMOM" || fmt === "E2MOM" || fmt === "E3MOM";
  const showTime = fmt === "ForTime" || fmt === "RFT" || fmt === "Chipper" || fmt === "Simulation";

  return (
    <div className="border-t border-[color:var(--color-line)] pt-4">
      <div className="label">{t("lg.run.perfTitle")}</div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {showRounds && (
          <NumberField
            label={t("lg.run.rounds")}
            value={perf?.rounds}
            onChange={(v) => onChange({ rounds: v })}
            placeholder={t("lg.run.roundsPh")}
          />
        )}
        {showReps && (
          <NumberField
            label={t("lg.run.extraReps")}
            value={perf?.reps}
            onChange={(v) => onChange({ reps: v })}
            placeholder={t("lg.run.extraRepsPh")}
          />
        )}
        {showTime && (
          <TimeField
            label={t("lg.run.finalTime")}
            value={perf?.timeSeconds}
            onChange={(v) => onChange({ timeSeconds: v })}
          />
        )}
        {!showRounds && !showReps && !showTime && (
          <NumberField
            label={t("lg.run.loadRpe")}
            value={perf?.reps}
            onChange={(v) => onChange({ reps: v })}
            placeholder={t("lg.run.repsPh")}
          />
        )}
      </div>
      <textarea
        value={perf?.notes ?? ""}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder={t("lg.run.notesPh")}
        rows={2}
        className="mt-3 w-full border border-[color:var(--color-line)] bg-transparent p-2 text-sm placeholder:text-[color:var(--color-mute)] focus:border-white focus:outline-none"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
        className="mono mt-1 w-full border border-[color:var(--color-line)] bg-transparent p-2 text-lg tabular-nums placeholder:text-[color:var(--color-mute)] focus:border-white focus:outline-none"
      />
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  const [text, setText] = useState(value !== undefined ? formatClock(value) : "");

  function commit(v: string) {
    setText(v);
    const m = v.match(/^(\d+):(\d{1,2})$/);
    if (m) {
      const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      onChange(total);
    } else if (v === "") {
      onChange(undefined);
    }
  }

  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="text"
        value={text}
        placeholder="07:42"
        onChange={(e) => commit(e.target.value)}
        className="mono mt-1 w-full border border-[color:var(--color-line)] bg-transparent p-2 text-lg tabular-nums placeholder:text-[color:var(--color-mute)] focus:border-white focus:outline-none"
      />
    </label>
  );
}

// ============================================================================
// Écran de fin
// ============================================================================

function SessionDoneScreen({
  focus,
  sessionElapsed,
  blocks,
  perf,
  completed,
  estimatedMinutes,
}: {
  focus: string;
  sessionElapsed: number;
  blocks: Block[];
  perf: Record<number, PerfEntry>;
  completed: Set<number>;
  estimatedMinutes: number;
}) {
  const t = useT();
  const summary = useMemo(() => {
    return blocks
      .map((b, i) => {
        const p = perf[i];
        const isDone = completed.has(i);
        if (!p && !isDone) return null;
        const parts: string[] = [];
        if (p?.rounds !== undefined) parts.push(t("lg.run.sumRounds", { n: p.rounds }));
        if (p?.reps !== undefined) parts.push(t("lg.run.sumReps", { n: p.reps }));
        if (p?.timeSeconds !== undefined) parts.push(formatClock(p.timeSeconds));
        if (p?.notes) parts.push(p.notes);
        if (parts.length === 0 && isDone) parts.push(t("lg.run.sumDone"));
        return { name: b.name, line: parts.join(" · ") };
      })
      .filter((x): x is { name: string; line: string } => x !== null);
  }, [blocks, perf, completed, t]);

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <Dumbbell size={40} className="mx-auto opacity-80" />
      <div className="label mt-8">{t("lg.run.doneLabel")}</div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{t("lg.run.doneTitle")}</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        {t("lg.run.doneLine", { focus, n: blocks.length, clock: formatClock(sessionElapsed) })}
        {estimatedMinutes > 0 && <>{t("lg.run.doneEst", { n: estimatedMinutes })}</>}.
      </p>

      {summary.length > 0 && (
        <div className="mt-8 text-left card p-6">
          <div className="label">{t("lg.run.perfLabel")}</div>
          <ul className="mt-3 space-y-2">
            {summary.map((s, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--color-line)] pb-2 last:border-b-0"
              >
                <span className="text-sm">{s.name}</span>
                <span className="mono text-xs text-[color:var(--color-mute)]">{s.line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          <PlayCircle size={14} /> {t("lg.run.backDash")}
        </Link>
        <Link href="/training" className="btn-ghost">
          {t("lg.run.seeWeek")}
        </Link>
      </div>
    </section>
  );
}
