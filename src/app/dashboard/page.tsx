import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  MoreHorizontal,
  Target,
  TrendingUp,
  Play,
  RotateCcw,
} from "lucide-react";
import { clerkEnabled } from "@/lib/clerk";
import {
  getDemoState,
  orderedWeek,
  resolveTodaySession,
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
  type Day,
  type Exercise,
} from "@/lib/programming";
import { BlockHeader } from "@/components/block-header";
import { setFatigue, resetDemo, moveDay, resetWeekOrder } from "./actions";

export const metadata = { title: "Dashboard — EL COACH METHOD" };

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
        {today.template.name} · by El Coach Method · Semaine {today.weekNumber} · {DAY_FULL_NAMES[today.dayNumber - 1]}
      </p>

      <WeeklyCalendarBar today={today} weekOrder={demo.weekOrder} />

      <div className="mt-10 grid gap-px bg-[color:var(--color-line)] grid-cols-2 md:grid-cols-4">
        <KPI icon={<Flame size={16} />} label="STREAK" value="14j" />
        <KPI icon={<Activity size={16} />} label="SÉANCES" value="42" />
        <KPI icon={<Target size={16} />} label="PR CE MOIS" value="3" />
        <KPI icon={<TrendingUp size={16} />} label="VOLUME" value="128T" />
      </div>

      <WeekOverview today={today} weekOrder={demo.weekOrder} />

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

// ============================================================================
// Barre calendrier hebdo Lun-Dim (cahier des charges § 07)
// ============================================================================

function WeeklyCalendarBar({
  today,
  weekOrder,
}: {
  today: TodaySession;
  weekOrder: number[] | null;
}) {
  // On affiche la semaine grégorienne du Lundi au Dimanche autour d'aujourd'hui.
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const todayWeekday = now.getDay() === 0 ? 7 : now.getDay(); // 1 = Lun, 7 = Dim
  const monday = new Date(now);
  monday.setDate(now.getDate() - (todayWeekday - 1));

  const orderedDays = orderedWeek(today.template, weekOrder);

  // Pour chaque position 1..7 (Lun..Dim), récupère la programmation prévue.
  const cells = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const programDay = orderedDays[i] ?? null;
    const isToday = date.toISOString().slice(0, 10) === todayIso;
    const isRest = !programDay || programDay.blocks.length === 0;
    return { date, programDay, isToday, isRest };
  });

  const monthLabel = monday.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="mt-8 border border-[color:var(--color-line)] bg-[color:var(--color-ash)]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-4 py-3">
        <button
          type="button"
          className="text-[color:var(--color-mute)] hover:text-white disabled:opacity-30"
          aria-label="Semaine précédente"
          disabled
          title="Bientôt"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="mono text-xs uppercase tracking-[0.2em]">{monthLabel}</div>
        <button
          type="button"
          className="text-[color:var(--color-mute)] hover:text-white disabled:opacity-30"
          aria-label="Semaine suivante"
          disabled
          title="Bientôt"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dayNum = cell.date.getDate();
          const dayShort = DAY_SHORT_NAMES[i];
          // Point coloré : vert (séance prévue passée — ici on triche : on considère comme "fait" si avant aujourd'hui),
          // jaune (séance prévue future), vide (rest).
          let dotClass = "";
          if (cell.isRest) dotClass = "";
          else {
            const isPast = cell.date < new Date(todayIso);
            dotClass = isPast
              ? "bg-emerald-400"
              : cell.isToday
                ? "bg-[color:var(--color-accent)]"
                : "bg-white";
          }
          return (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 px-1 py-3 text-center ${
                cell.isToday ? "border-b-2 border-[color:var(--color-accent)]" : ""
              }`}
            >
              <div className="mono text-[10px] tracking-[0.2em] text-[color:var(--color-mute)]">
                {dayShort}
              </div>
              <div
                className={`mono text-lg font-semibold tabular-nums ${
                  cell.isToday ? "text-[color:var(--color-accent)]" : ""
                }`}
              >
                {dayNum}
              </div>
              <div className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekOverview({
  today,
  weekOrder,
}: {
  today: TodaySession;
  weekOrder: number[] | null;
}) {
  const days = orderedWeek(today.template, weekOrder);
  const currentDay = todayDayNumber();
  const isCustomOrder = weekOrder !== null;

  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="label">[ SEMAINE {today.weekNumber} · réorganisable ]</div>
        {isCustomOrder && (
          <form action={resetWeekOrder}>
            <button
              type="submit"
              className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
            >
              <RotateCcw size={12} /> Réinitialiser l&apos;ordre
            </button>
          </form>
        )}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {days.map((d, displayIndex) => (
          <DayCard
            key={d.day}
            day={d}
            displayIndex={displayIndex}
            totalDays={days.length}
            isToday={d.day === currentDay}
          />
        ))}
      </div>
    </div>
  );
}

function DayCard({
  day,
  displayIndex,
  totalDays,
  isToday,
}: {
  day: Day;
  displayIndex: number;
  totalDays: number;
  isToday: boolean;
}) {
  const isRest = day.blocks.length === 0;
  const dayName = DAY_FULL_NAMES[day.day - 1] ?? `Jour ${day.day}`;
  const shortName = DAY_SHORT_NAMES[day.day - 1] ?? "—";
  const isFirst = displayIndex === 0;
  const isLast = displayIndex === totalDays - 1;

  return (
    <article
      className={`flex h-full flex-col gap-3 border p-4 md:p-5 ${
        isToday
          ? "border-white bg-white/5"
          : "border-[color:var(--color-line)] bg-[color:var(--color-ash)]"
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mono text-[11px] tracking-[0.2em] text-[color:var(--color-mute)]">
            {shortName} · {dayName.toUpperCase()}
          </div>
          <h3 className={`mt-1.5 text-base font-semibold leading-tight md:text-lg ${isRest ? "text-[color:var(--color-mute)]" : ""}`}>
            {isRest ? "REST" : day.focus}
          </h3>
        </div>
        {isToday && (
          <span className="mono shrink-0 border border-white px-1.5 py-0.5 text-[10px] tracking-[0.15em]">
            AUJ.
          </span>
        )}
      </header>

      {!isRest && (
        <div className="mono text-xs text-[color:var(--color-mute)]">
          {day.estimatedMinutes}min · {day.blocks.length} blocs
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-2">
        {!isRest ? (
          <Link
            href={`/dashboard/session?day=${day.day}`}
            className="btn-primary flex-1 justify-center text-sm"
          >
            <Play size={12} /> Démarrer
          </Link>
        ) : (
          <span className="flex-1 px-3 py-2 text-center text-xs text-[color:var(--color-mute)]">
            {day.notes ?? "OFF"}
          </span>
        )}
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center justify-center border border-[color:var(--color-line)] p-2 text-[color:var(--color-mute)] hover:text-white [&::-webkit-details-marker]:hidden">
            <MoreHorizontal size={14} />
          </summary>
          <div className="absolute right-0 top-full z-20 mt-1 w-56 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] shadow-lg">
            <div className="mono border-b border-[color:var(--color-line)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-mute)]">
              Move your session
            </div>
            <form action={moveDay}>
              <input type="hidden" name="day" value={day.day} />
              <input type="hidden" name="direction" value="up" />
              <button
                type="submit"
                disabled={isFirst}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[color:var(--color-mute)] hover:bg-black hover:text-white disabled:opacity-30"
              >
                <ArrowUp size={12} /> Déplacer vers le haut
              </button>
            </form>
            <form action={moveDay}>
              <input type="hidden" name="day" value={day.day} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={isLast}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[color:var(--color-mute)] hover:bg-black hover:text-white disabled:opacity-30"
              >
                <ArrowDown size={12} /> Déplacer vers le bas
              </button>
            </form>
            {!isRest && (
              <Link
                href={`/training/${day.adaptive ? "" : ""}#change-session`}
                className="flex w-full items-center gap-2 border-t border-[color:var(--color-line)] px-3 py-2 text-xs text-[color:var(--color-mute)] hover:bg-black hover:text-white"
              >
                ↻ Changer la séance du jour
              </Link>
            )}
            {!isRest && (
              <Link
                href={`/dashboard/session?day=${day.day}`}
                className="flex w-full items-center gap-2 border-t border-[color:var(--color-line)] px-3 py-2 text-xs text-[color:var(--color-mute)] hover:bg-black hover:text-white"
              >
                <Play size={12} /> Démarrer cette séance
              </Link>
            )}
          </div>
        </details>
      </div>
    </article>
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
    <div className="bg-[color:var(--color-ash)] p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="label truncate">{label}</span>
        <span className="shrink-0">{icon}</span>
      </div>
      <div className="mono mt-3 text-2xl font-semibold md:mt-4 md:text-3xl">{value}</div>
    </div>
  );
}

