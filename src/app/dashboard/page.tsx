import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Activity, Flame, Target, TrendingUp, Play, RotateCcw } from "lucide-react";
import { clerkEnabled } from "@/lib/clerk";
import {
  getDemoState,
  resolveTodaySession,
  weekOverview,
  todayDayNumber,
  DAY_SHORT_NAMES,
  DAY_FULL_NAMES,
  type TodaySession,
} from "@/lib/demo-session";
import {
  blockLetter,
  formatExerciseLine,
  resolveExerciseMovement,
  type Block,
  type Exercise,
} from "@/lib/programming";
import { BlockHeader } from "@/components/block-header";
import { setFatigue, resetDemo } from "./actions";

export const metadata = { title: "Dashboard — EL COACH" };

const FATIGUE_PRESETS: { score: number; label: string; hint: string }[] = [
  { score: 1, label: "Frais", hint: "Sommeil bon, zéro courbature" },
  { score: 3, label: "Correct", hint: "Légères courbatures" },
  { score: 5, label: "Chargé", hint: "Semaine dense, sommeil moyen" },
  { score: 7, label: "Cramé", hint: "Dette de sommeil, RPE élevé" },
  { score: 9, label: "Vidé", hint: "Quasi nuit blanche" },
];

export default async function DashboardPage() {
  const demo = await getDemoState();

  let userFirstName: string | null = null;
  if (clerkEnabled) {
    const session = await auth();
    if (session.userId) {
      const user = await currentUser();
      userFirstName = user?.firstName ?? null;
    }
  }

  if (!demo.programSlug) {
    return <EmptyState />;
  }

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore);
  if (!today) return <EmptyState />;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ DASHBOARD ]</div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Salut {userFirstName ?? "Athlète"}.
        </h1>
        <form action={resetDemo}>
          <button type="submit" className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white">
            <RotateCcw size={12} /> Changer de programme
          </button>
        </form>
      </div>
      <p className="mt-3 text-[color:var(--color-mute)]">
        {today.template.name} · Semaine {today.weekNumber} · {DAY_FULL_NAMES[today.dayNumber - 1]}
      </p>

      <div className="mt-10 grid gap-px bg-[color:var(--color-line)] md:grid-cols-4">
        <KPI icon={<Flame size={16} />} label="STREAK" value="14j" />
        <KPI icon={<Activity size={16} />} label="SÉANCES" value="42" />
        <KPI icon={<Target size={16} />} label="PR CE MOIS" value="3" />
        <KPI icon={<TrendingUp size={16} />} label="VOLUME" value="128T" />
      </div>

      <WeekOverview today={today} />

      <TodayCard today={today} />
    </section>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="label">[ DASHBOARD ]</div>
      <h1 className="mt-4 text-4xl font-semibold">Pas encore de programme</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        Choisis une programmation pour activer ton dashboard, ta semaine et ta séance du jour.
      </p>
      <Link href="/onboarding" className="btn-primary mt-8 inline-flex">
        Choisir mon programme
      </Link>
    </section>
  );
}

function WeekOverview({ today }: { today: TodaySession }) {
  const days = weekOverview(today.template);
  const currentDay = todayDayNumber();
  return (
    <div className="mt-12">
      <div className="label">[ SEMAINE {today.weekNumber} ]</div>
      <div className="mt-4 grid gap-px bg-[color:var(--color-line)] grid-cols-7">
        {days.map((d) => {
          const isToday = d.day === currentDay;
          const isRest = d.blocks.length === 0;
          return (
            <div
              key={d.day}
              className={`bg-[color:var(--color-ash)] p-3 md:p-4 ${isToday ? "!bg-white !text-black" : ""}`}
            >
              <div className="mono text-[10px] tracking-[0.2em] opacity-60">
                {DAY_SHORT_NAMES[d.day - 1]}
              </div>
              <div className="mt-2 text-xs md:text-sm font-semibold">
                {isRest ? "REST" : d.focus.split(" ").slice(0, 3).join(" ")}
              </div>
              {!isRest && (
                <div className={`mono mt-2 text-[10px] ${isToday ? "opacity-60" : "text-[color:var(--color-mute)]"}`}>
                  {d.estimatedMinutes}min
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TodayCard({ today }: { today: TodaySession }) {
  if (today.needsFatigueInput) {
    return (
      <div className="mt-12 card grain p-8">
        <div className="label">[ SÉANCE DU JOUR · ADAPTATIF ]</div>
        <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Cooldown à calibrer</h2>
        <p className="mt-3 text-[color:var(--color-mute)]">
          Comment tu te sens ce matin ? Le système choisit la bonne modalité :
          walk Z1, footing Z2, nage technique, boxe technique, ou repos complet.
        </p>
        <div className="mt-8 grid gap-px bg-[color:var(--color-line)] md:grid-cols-5">
          {FATIGUE_PRESETS.map((preset) => (
            <form key={preset.score} action={setFatigue}>
              <input type="hidden" name="score" value={preset.score} />
              <button
                type="submit"
                className="flex w-full flex-col items-start gap-2 bg-[color:var(--color-ash)] p-4 text-left transition-colors hover:bg-black"
              >
                <div className="mono text-2xl font-semibold">{preset.score}</div>
                <div className="label">{preset.label}</div>
                <div className="text-xs text-[color:var(--color-mute)]">{preset.hint}</div>
              </button>
            </form>
          ))}
        </div>
      </div>
    );
  }

  if (today.day.blocks.length === 0) {
    return (
      <div className="mt-12 card grain p-8">
        <div className="label">[ AUJOURD&apos;HUI ]</div>
        <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Jour de repos</h2>
        <p className="mt-3 text-[color:var(--color-mute)]">
          {today.day.notes ?? "Off total. Sommeil, nutrition, récupération."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">[ SÉANCE DU JOUR ]</div>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{today.day.focus}</h2>
          <div className="mono mt-2 text-xs text-[color:var(--color-mute)]">
            {today.day.estimatedMinutes}min · {today.day.blocks.length} blocs
          </div>
        </div>
        <Link href="/dashboard/session" className="btn-primary inline-flex">
          <Play size={14} /> Démarrer la séance
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {today.day.blocks.map((block, i) => (
          <BlockCard key={`${block.name}-${i}`} block={block} index={i} />
        ))}
      </div>

      {today.day.notes && (
        <p className="mono mt-6 text-xs text-[color:var(--color-mute)]">{today.day.notes}</p>
      )}
    </div>
  );
}

function BlockCard({ block, index }: { block: Block; index: number }) {
  return (
    <div className="card p-6">
      <BlockHeader block={block} letter={blockLetter(index)} />

      <ul className="mt-5 space-y-1.5 pl-12">
        {block.exercises.map((ex, i) => (
          <ExerciseRow key={`${ex.movementId}-${i}`} exercise={ex} />
        ))}
      </ul>

      {block.notes && (
        <p className="mono mt-4 border-t border-[color:var(--color-line)] pt-3 pl-12 text-xs text-[color:var(--color-mute)]">
          {block.notes}
        </p>
      )}
    </div>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const movement = resolveExerciseMovement(exercise);
  const name = movement?.name ?? exercise.movementId;
  const { primary, secondary } = formatExerciseLine(exercise, name);
  return (
    <li>
      <div className="text-sm leading-snug">{primary}</div>
      {secondary && (
        <div className="mt-0.5 text-xs text-[color:var(--color-mute)]">{secondary}</div>
      )}
    </li>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[color:var(--color-ash)] p-6">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon}
      </div>
      <div className="mono mt-4 text-3xl font-semibold">{value}</div>
    </div>
  );
}

