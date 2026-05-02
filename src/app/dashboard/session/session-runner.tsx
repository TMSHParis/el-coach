"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Dumbbell,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  Video,
} from "lucide-react";
import {
  resolveExerciseMovement,
  type Block,
  type Exercise,
  type WodFormat,
} from "@/lib/programming";
import { youtubeSearchUrl } from "@/lib/movements";

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

// Parse une durée type "10min", "30s", "sub 8min", "12min" → secondes (heuristique).
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

export default function SessionRunner({
  initialBlocks,
  templateName,
  dayLabel,
  focus,
  estimatedMinutes,
}: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [perf, setPerf] = useState<Record<number, PerfEntry>>({});

  // Chrono total séance (démarre au mount).
  const [sessionElapsed, setSessionElapsed] = useState(0);
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setSessionElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  const block = blocks[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === blocks.length - 1;

  function moveBlock(from: number, to: number) {
    if (to < 0 || to >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    if (stepIndex === from) setStepIndex(to);
    else if (stepIndex === to) setStepIndex(from);
  }

  function completeBlock(idx: number) {
    setCompletedBlocks((prev) => new Set(prev).add(idx));
  }

  function updatePerf(idx: number, patch: Partial<PerfEntry>) {
    setPerf((prev) => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));
  }

  if (done) {
    return (
      <SessionDoneScreen
        focus={focus}
        sessionElapsed={sessionElapsed}
        blocks={blocks}
        perf={perf}
        estimatedMinutes={estimatedMinutes}
      />
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/dashboard"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        <ArrowLeft size={14} /> Quitter la séance
      </Link>

      <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">
            [ {templateName.toUpperCase()} · {dayLabel.toUpperCase()} ]
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{focus}</h1>
        </div>
        <div className="card px-4 py-3 text-right">
          <div className="label">CHRONO SÉANCE</div>
          <div className="mono mt-1 text-2xl font-semibold tabular-nums">{formatClock(sessionElapsed)}</div>
        </div>
      </header>

      <StepProgress total={blocks.length} current={stepIndex} completed={completedBlocks} />

      <BlockReorder
        blocks={blocks}
        currentIndex={stepIndex}
        completed={completedBlocks}
        onJump={setStepIndex}
        onMove={moveBlock}
      />

      <BlockFocus
        block={block}
        stepIndex={stepIndex}
        totalSteps={blocks.length}
        perf={perf[stepIndex]}
        onUpdatePerf={(patch) => updatePerf(stepIndex, patch)}
        completed={completedBlocks.has(stepIndex)}
        onComplete={() => completeBlock(stepIndex)}
      />

      <nav className="mt-10 grid grid-cols-2 gap-3">
        {isFirst ? (
          <Link href="/dashboard" className="btn-ghost justify-center">
            <ArrowLeft size={14} /> Dashboard
          </Link>
        ) : (
          <button onClick={() => setStepIndex(stepIndex - 1)} className="btn-ghost justify-center">
            <ArrowLeft size={14} /> Bloc précédent
          </button>
        )}
        {isLast ? (
          <button onClick={() => setDone(true)} className="btn-primary justify-center">
            Terminer <Check size={14} />
          </button>
        ) : (
          <button onClick={() => setStepIndex(stepIndex + 1)} className="btn-primary justify-center">
            Bloc suivant <ArrowRight size={14} />
          </button>
        )}
      </nav>
    </section>
  );
}

function StepProgress({
  total,
  current,
  completed,
}: {
  total: number;
  current: number;
  completed: Set<number>;
}) {
  return (
    <div className="mt-8 flex gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = completed.has(i);
        const isCurrent = i === current;
        const isPast = i < current;
        return (
          <div
            key={i}
            className={`h-1 flex-1 ${
              isDone ? "bg-emerald-400" : isCurrent || isPast ? "bg-white" : "bg-[color:var(--color-line)]"
            }`}
          />
        );
      })}
    </div>
  );
}

function BlockReorder({
  blocks,
  currentIndex,
  completed,
  onJump,
  onMove,
}: {
  blocks: Block[];
  currentIndex: number;
  completed: Set<number>;
  onJump: (idx: number) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <details className="mt-6 group">
      <summary className="label cursor-pointer text-[color:var(--color-mute)] hover:text-white">
        ▸ Plan de séance · {blocks.length} blocs (clic pour intervertir)
      </summary>
      <ul className="mt-3 space-y-1">
        {blocks.map((b, i) => {
          const active = i === currentIndex;
          const isDone = completed.has(i);
          return (
            <li
              key={`${b.name}-${i}`}
              className={`flex items-center gap-2 border border-[color:var(--color-line)] px-3 py-2 text-sm ${
                active ? "border-white bg-[color:var(--color-ash)]" : ""
              }`}
            >
              <button
                onClick={() => onJump(i)}
                className={`flex-1 text-left ${active ? "font-semibold" : ""}`}
              >
                <span className="mono mr-2 text-xs text-[color:var(--color-mute)]">{i + 1}.</span>
                {b.name}
                {isDone && <span className="ml-2 text-xs text-emerald-400">✓</span>}
              </button>
              <button
                onClick={() => onMove(i, i - 1)}
                disabled={i === 0}
                className="p-1 text-[color:var(--color-mute)] hover:text-white disabled:opacity-20"
                aria-label="Monter"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => onMove(i, i + 1)}
                disabled={i === blocks.length - 1}
                className="p-1 text-[color:var(--color-mute)] hover:text-white disabled:opacity-20"
                aria-label="Descendre"
              >
                <ArrowDown size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function BlockFocus({
  block,
  stepIndex,
  totalSteps,
  perf,
  onUpdatePerf,
  completed,
  onComplete,
}: {
  block: Block;
  stepIndex: number;
  totalSteps: number;
  perf?: PerfEntry;
  onUpdatePerf: (patch: Partial<PerfEntry>) => void;
  completed: boolean;
  onComplete: () => void;
}) {
  const isWarmupOrCooldown = block.type === "warmup" || block.type === "cooldown";

  return (
    <div className="mt-10 card p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="label">
            BLOC {stepIndex + 1} / {totalSteps} · {block.type}
          </div>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{block.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          {block.format && <span className="mono text-sm">{block.format}</span>}
          {block.duration && (
            <span className="mono text-sm text-[color:var(--color-mute)]">{block.duration}</span>
          )}
          {block.rounds && (
            <span className="mono text-sm text-[color:var(--color-mute)]">×{block.rounds}</span>
          )}
        </div>
      </div>

      {/* Timer dédié selon le format du bloc */}
      <BlockTimer block={block} />

      <ul className="mt-6 divide-y divide-[color:var(--color-line)]">
        {block.exercises.map((ex, i) => (
          <ExerciseLine key={`${ex.movementId}-${i}`} exercise={ex} />
        ))}
      </ul>

      {block.notes && (
        <p className="mono mt-6 border-t border-[color:var(--color-line)] pt-4 text-xs text-[color:var(--color-mute)]">
          {block.notes}
        </p>
      )}

      {/* Saisie performances pour les blocs WOD/conditioning/strength */}
      {!isWarmupOrCooldown && (
        <PerfInput block={block} perf={perf} onChange={onUpdatePerf} />
      )}

      {/* Mark as completed pour warmup / cooldown */}
      {isWarmupOrCooldown && (
        <div className="mt-6 border-t border-[color:var(--color-line)] pt-4">
          <button
            onClick={onComplete}
            disabled={completed}
            className={`btn-primary w-full justify-center ${completed ? "opacity-60" : ""}`}
          >
            {completed ? (
              <>
                <Check size={14} /> {block.type === "warmup" ? "Échauffement" : "Cooldown"} fait
              </>
            ) : (
              <>
                <Check size={14} /> Mark as completed
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ExerciseLine({ exercise }: { exercise: Exercise }) {
  const movement = resolveExerciseMovement(exercise);
  const name = movement?.name ?? exercise.movementId;
  const prescription = formatPrescription(exercise);
  const videoHref = movement?.videoUrl ?? youtubeSearchUrl(name);
  return (
    <li className="flex items-start gap-4 py-4">
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-base font-medium">{name}</span>
          <span className="mono text-xs text-[color:var(--color-mute)]">{prescription}</span>
        </div>
        {exercise.notes && (
          <div className="mt-1 text-xs text-[color:var(--color-mute)]">{exercise.notes}</div>
        )}
      </div>
      <a
        href={videoHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 shrink-0 text-[color:var(--color-mute)] hover:text-white"
        aria-label={`Vidéo démo · ${name}`}
        title="Vidéo démo"
      >
        <Video size={16} />
      </a>
    </li>
  );
}

// ============================================================================
// Timers par format de bloc
// ============================================================================

function BlockTimer({ block }: { block: Block }) {
  // Reset timer à chaque changement de bloc via key dans le parent.
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

  // StraightSets / Superset / Skill / Simulation : juste chrono libre
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
    <div className="mt-6 grid gap-3 border border-[color:var(--color-line)] bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="label">TIMER · {label}</div>
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
          onClick={() => setRunning((r) => !r)}
          className="btn-primary justify-center"
          disabled={isOver}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? "Pause" : elapsed === 0 ? "Démarrer" : "Reprendre"}
        </button>
        <button
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

  // Petit beep visuel quand on entame un nouvel intervalle
  const isNewInterval = intervalElapsed === 0 && elapsed > 0;

  return (
    <div className="mt-6 grid gap-3 border border-[color:var(--color-line)] bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="label">
          TIMER · {label} · INTERVALLE {currentInterval}
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
            Total : {formatClock(elapsed)} / {formatClock(totalSec)}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="btn-primary justify-center"
          disabled={isOver}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? "Pause" : elapsed === 0 ? "Démarrer" : "Reprendre"}
        </button>
        <button
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
    <div className="mt-6 grid gap-3 border border-[color:var(--color-line)] bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="label">
          TABATA · ROUND {currentRound} / {rounds} · {isWork ? "WORK" : "REST"}
        </div>
        <div
          className={`mono mt-1 text-5xl font-semibold tabular-nums ${
            isWork ? "text-white" : "text-[color:var(--color-mute)]"
          } ${isOver ? "text-emerald-400" : ""}`}
        >
          {formatClock(remaining)}
        </div>
        <div className="mono mt-1 text-xs text-[color:var(--color-mute)]">
          {workSec}s work · {restSec}s rest · {rounds} rounds
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="btn-primary justify-center"
          disabled={isOver}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? "Pause" : elapsed === 0 ? "Démarrer" : "Reprendre"}
        </button>
        <button
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
  // Champs proposés selon format
  const fmt = block.format;
  const showRounds = fmt === "AMRAP";
  const showReps = fmt === "AMRAP" || fmt === "EMOM" || fmt === "E2MOM" || fmt === "E3MOM";
  const showTime = fmt === "ForTime" || fmt === "RFT" || fmt === "Chipper" || fmt === "Simulation";

  return (
    <div className="mt-6 border-t border-[color:var(--color-line)] pt-4">
      <div className="label">PERFORMANCES</div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {showRounds && (
          <NumberField
            label="Rounds complets"
            value={perf?.rounds}
            onChange={(v) => onChange({ rounds: v })}
            placeholder="ex: 6"
          />
        )}
        {showReps && (
          <NumberField
            label="Reps additionnelles"
            value={perf?.reps}
            onChange={(v) => onChange({ reps: v })}
            placeholder="ex: 12"
          />
        )}
        {showTime && (
          <TimeField
            label="Temps final (mm:ss)"
            value={perf?.timeSeconds}
            onChange={(v) => onChange({ timeSeconds: v })}
          />
        )}
        {!showRounds && !showReps && !showTime && (
          <NumberField
            label="Charge / RPE / notes (reps)"
            value={perf?.reps}
            onChange={(v) => onChange({ reps: v })}
            placeholder="reps"
          />
        )}
      </div>
      <textarea
        value={perf?.notes ?? ""}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Notes : sensation, charge, scaling…"
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
  estimatedMinutes,
}: {
  focus: string;
  sessionElapsed: number;
  blocks: Block[];
  perf: Record<number, PerfEntry>;
  estimatedMinutes: number;
}) {
  const summary = useMemo(() => {
    return blocks
      .map((b, i) => {
        const p = perf[i];
        if (!p) return null;
        const parts: string[] = [];
        if (p.rounds !== undefined) parts.push(`${p.rounds} rd`);
        if (p.reps !== undefined) parts.push(`${p.reps} reps`);
        if (p.timeSeconds !== undefined) parts.push(formatClock(p.timeSeconds));
        if (p.notes) parts.push(p.notes);
        return { name: b.name, line: parts.join(" · ") };
      })
      .filter((x): x is { name: string; line: string } => x !== null);
  }, [blocks, perf]);

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <Dumbbell size={40} className="mx-auto opacity-80" />
      <div className="label mt-8">[ SÉANCE TERMINÉE ]</div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Bien joué.</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        {focus} · {blocks.length} blocs · {formatClock(sessionElapsed)} (estimé {estimatedMinutes}min).
      </p>

      {summary.length > 0 && (
        <div className="mt-8 text-left card p-6">
          <div className="label">[ PERFORMANCES ]</div>
          <ul className="mt-3 space-y-2">
            {summary.map((s, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--color-line)] pb-2 last:border-b-0">
                <span className="text-sm">{s.name}</span>
                <span className="mono text-xs text-[color:var(--color-mute)]">{s.line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          <PlayCircle size={14} /> Retour au dashboard
        </Link>
        <Link href="/training" className="btn-ghost">
          Voir la semaine
        </Link>
      </div>
    </section>
  );
}

function formatPrescription(ex: Exercise): string {
  const parts: string[] = [];
  if (ex.sets !== undefined) {
    if (ex.reps !== undefined) parts.push(`${ex.sets}×${ex.reps}`);
    else if (ex.time) parts.push(`${ex.sets}×${ex.time}`);
    else if (ex.distance) parts.push(`${ex.sets}×${ex.distance}`);
    else parts.push(`${ex.sets} sets`);
  } else {
    if (ex.reps !== undefined) parts.push(`${ex.reps} reps`);
    if (ex.time && ex.sets === undefined) parts.push(ex.time);
    if (ex.distance && ex.sets === undefined) parts.push(ex.distance);
  }
  if (ex.load) parts.push(`@ ${ex.load}`);
  if (ex.tempo) parts.push(`T${ex.tempo}`);
  if (ex.rest) parts.push(`repos ${ex.rest}`);
  return parts.join(" · ");
}
