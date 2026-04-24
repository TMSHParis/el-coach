import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Dumbbell } from "lucide-react";
import {
  getDemoState,
  resolveTodaySession,
  DAY_FULL_NAMES,
  type TodaySession,
} from "@/lib/demo-session";
import {
  resolveExerciseMovement,
  type Block,
  type Exercise,
} from "@/lib/programming";

export const metadata = { title: "Séance en cours — EL COACH" };

export default async function SessionRunnerPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; done?: string }>;
}) {
  const { step: stepParam, done } = await searchParams;
  const demo = await getDemoState();

  if (!demo.programSlug) redirect("/onboarding");

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore);
  if (!today) redirect("/dashboard");

  if (today.needsFatigueInput) {
    return <FatigueBlocker />;
  }

  if (today.day.blocks.length === 0) {
    return <RestBlocker />;
  }

  if (done) {
    return <SessionDoneScreen today={today} />;
  }

  const stepIndex = Math.max(0, Math.min(Number(stepParam) || 0, today.day.blocks.length - 1));
  const block = today.day.blocks[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === today.day.blocks.length - 1;

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/dashboard"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        <ArrowLeft size={14} /> Quitter la séance
      </Link>

      <header className="mt-8">
        <div className="label">
          [ {today.template.name.toUpperCase()} · {DAY_FULL_NAMES[today.dayNumber - 1].toUpperCase()} ]
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{today.day.focus}</h1>
      </header>

      <StepProgress total={today.day.blocks.length} current={stepIndex} />

      <BlockFocus block={block} stepIndex={stepIndex} totalSteps={today.day.blocks.length} />

      <nav className="mt-10 grid grid-cols-2 gap-3">
        {isFirst ? (
          <Link href="/dashboard" className="btn-ghost justify-center">
            <ArrowLeft size={14} /> Dashboard
          </Link>
        ) : (
          <Link href={`/dashboard/session?step=${stepIndex - 1}`} className="btn-ghost justify-center">
            <ArrowLeft size={14} /> Bloc précédent
          </Link>
        )}
        {isLast ? (
          <Link href="/dashboard/session?done=1" className="btn-primary justify-center">
            Terminer <Check size={14} />
          </Link>
        ) : (
          <Link href={`/dashboard/session?step=${stepIndex + 1}`} className="btn-primary justify-center">
            Bloc suivant <ArrowRight size={14} />
          </Link>
        )}
      </nav>
    </section>
  );
}

function StepProgress({ total, current }: { total: number; current: number }) {
  return (
    <div className="mt-8 flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 ${i <= current ? "bg-white" : "bg-[color:var(--color-line)]"}`}
        />
      ))}
    </div>
  );
}

function BlockFocus({
  block,
  stepIndex,
  totalSteps,
}: {
  block: Block;
  stepIndex: number;
  totalSteps: number;
}) {
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

      <ul className="mt-6 divide-y divide-[color:var(--color-line)]">
        {block.exercises.map((ex, i) => (
          <ExerciseCheckItem key={`${ex.movementId}-${i}`} exercise={ex} index={i} />
        ))}
      </ul>

      {block.notes && (
        <p className="mono mt-6 border-t border-[color:var(--color-line)] pt-4 text-xs text-[color:var(--color-mute)]">
          {block.notes}
        </p>
      )}
    </div>
  );
}

function ExerciseCheckItem({ exercise, index }: { exercise: Exercise; index: number }) {
  const movement = resolveExerciseMovement(exercise);
  const name = movement?.name ?? exercise.movementId;
  const prescription = formatPrescription(exercise);
  const id = `ex-${index}-${exercise.movementId}`;
  return (
    <li className="group flex items-start gap-4 py-4">
      <input
        type="checkbox"
        id={id}
        className="mt-1 h-5 w-5 shrink-0 accent-white"
      />
      <label htmlFor={id} className="flex-1 cursor-pointer">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-base font-medium">{name}</span>
          <span className="mono text-xs text-[color:var(--color-mute)]">{prescription}</span>
        </div>
        {exercise.notes && (
          <div className="mt-1 text-xs text-[color:var(--color-mute)]">{exercise.notes}</div>
        )}
      </label>
    </li>
  );
}

function SessionDoneScreen({ today }: { today: TodaySession }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <Dumbbell size={40} className="mx-auto opacity-80" />
      <div className="label mt-8">[ SÉANCE TERMINÉE ]</div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        Bien joué.
      </h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        {today.day.focus} · {today.day.blocks.length} blocs validés · {today.day.estimatedMinutes}min.
        <br />
        À demain pour la suite.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">Retour au dashboard</Link>
        <Link href="/training" className="btn-ghost">Voir la semaine</Link>
      </div>
    </section>
  );
}

function FatigueBlocker() {
  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="label">[ COOLDOWN ADAPTATIF ]</div>
      <h1 className="mt-4 text-3xl font-semibold">Calibre d&apos;abord ta fatigue</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        Aujourd&apos;hui est un jour adaptatif : indique ton état sur le dashboard avant de lancer la séance.
      </p>
      <Link href="/dashboard" className="btn-primary mt-8 inline-flex">Retour dashboard</Link>
    </section>
  );
}

function RestBlocker() {
  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="label">[ REST ]</div>
      <h1 className="mt-4 text-3xl font-semibold">Aujourd&apos;hui c&apos;est off.</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        Sommeil, nutrition, récupération. La séance reprend demain.
      </p>
      <Link href="/dashboard" className="btn-primary mt-8 inline-flex">Retour dashboard</Link>
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
