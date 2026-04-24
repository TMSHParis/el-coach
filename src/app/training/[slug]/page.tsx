import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getTemplate,
  programTemplates,
  resolveAdaptiveDay,
  resolveExerciseMovement,
  type Block,
  type Day,
  type Exercise,
} from "@/lib/programming";

const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const FATIGUE_PRESETS: { score: number; label: string; hint: string }[] = [
  { score: 1, label: "Frais", hint: "Sommeil bon, pas de courbature, envie max" },
  { score: 3, label: "Correct", hint: "Légères courbatures, RPE soutenable" },
  { score: 5, label: "Chargé", hint: "Semaine dense, sommeil moyen" },
  { score: 7, label: "Cramé", hint: "Courbatures fortes, dette de sommeil" },
  { score: 9, label: "Vidé", hint: "Nuit blanche, RPE au plafond" },
];

export function generateStaticParams() {
  return programTemplates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) return { title: "Programmation introuvable — EL COACH" };
  return { title: `${template.name} — EL COACH` };
}

export default async function TrainingTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fatigue?: string; week?: string }>;
}) {
  const { slug } = await params;
  const { fatigue, week: weekParam } = await searchParams;

  const template = getTemplate(slug);
  if (!template) notFound();

  const weekIndex = Math.max(0, Math.min((Number(weekParam) || 1) - 1, template.weeks.length - 1));
  const week = template.weeks[weekIndex];
  const fatigueScore = fatigue !== undefined ? Number(fatigue) : undefined;

  const activeDays = week.days.filter((d) => d.blocks.length > 0).length;
  const totalMinutes = week.days.reduce((acc, d) => acc + d.estimatedMinutes, 0);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <Link
        href="/training"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        <ArrowLeft size={14} />
        Toutes les programmations
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-[2fr_1fr] md:items-end">
        <div>
          <div className="label">[ {template.discipline.toUpperCase()} · {template.level.toUpperCase()} ]</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">{template.name}</h1>
          <p className="mt-5 max-w-2xl text-[color:var(--color-mute)]">{template.summary}</p>
        </div>

        <aside className="card grain p-6">
          <div className="grid grid-cols-3 gap-4">
            <Meta label="SÉANCES" value={`${activeDays}/sem`} />
            <Meta label="VOLUME" value={`${totalMinutes}min`} />
            <Meta label="SEMAINE" value={`${week.weekNumber}`} />
          </div>
          <div className="mt-5 border-t border-[color:var(--color-line)] pt-4">
            <div className="label">ÉQUIPEMENT</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {template.equipment.map((e) => (
                <span key={e} className="mono text-xs text-[color:var(--color-mute)]">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {week.theme && (
        <p className="mt-10 border-l-2 border-white pl-4 text-sm text-[color:var(--color-mute)]">
          {week.theme}
        </p>
      )}

      <div className="mt-12 space-y-px bg-[color:var(--color-line)]">
        {week.days.map((day) => (
          <DayRow
            key={day.day}
            day={day}
            templateSlug={template.slug}
            fatigueScore={fatigueScore}
          />
        ))}
      </div>
    </section>
  );
}

function DayRow({
  day,
  templateSlug,
  fatigueScore,
}: {
  day: Day;
  templateSlug: string;
  fatigueScore?: number;
}) {
  const dayName = DAY_NAMES[(day.day - 1) % 7] ?? `J${day.day}`;

  if (day.blocks.length === 0) {
    return (
      <div className="grid gap-4 bg-[color:var(--color-ash)] p-6 md:grid-cols-[180px_1fr] md:p-8">
        <div>
          <div className="label">{dayName} · J{day.day}</div>
          <h2 className="mono mt-2 text-lg">REST</h2>
        </div>
        <div className="text-sm text-[color:var(--color-mute)]">
          {day.notes ?? "Jour off."}
        </div>
      </div>
    );
  }

  if (day.adaptive) {
    return (
      <AdaptiveDayCard
        day={day}
        dayName={dayName}
        templateSlug={templateSlug}
        fatigueScore={fatigueScore}
      />
    );
  }

  return (
    <article className="grid gap-6 bg-[color:var(--color-ash)] p-6 md:grid-cols-[180px_1fr] md:p-8">
      <header>
        <div className="label">{dayName} · J{day.day}</div>
        <h2 className="mt-2 text-xl font-semibold">{day.focus}</h2>
        <div className="mono mt-3 text-xs text-[color:var(--color-mute)]">
          {day.estimatedMinutes}min
        </div>
      </header>
      <div className="space-y-6">
        {day.blocks.map((block, i) => (
          <BlockCard key={`${block.name}-${i}`} block={block} />
        ))}
        {day.notes && (
          <p className="mono text-xs text-[color:var(--color-mute)]">{day.notes}</p>
        )}
      </div>
    </article>
  );
}

function AdaptiveDayCard({
  day,
  dayName,
  templateSlug,
  fatigueScore,
}: {
  day: Day;
  dayName: string;
  templateSlug: string;
  fatigueScore?: number;
}) {
  if (fatigueScore === undefined) {
    return (
      <article className="grid gap-6 bg-[color:var(--color-ash)] p-6 md:grid-cols-[180px_1fr] md:p-8">
        <header>
          <div className="label">{dayName} · J{day.day}</div>
          <h2 className="mt-2 text-xl font-semibold">Cooldown adaptatif</h2>
          <div className="mono mt-3 text-xs text-[color:var(--color-mute)]">
            À résoudre selon fatigue
          </div>
        </header>
        <div>
          <p className="text-sm text-[color:var(--color-mute)]">
            Indique ta fatigue ce matin. Le système choisit la modalité adaptée :
            walk Zone 1, footing Zone 2, nage technique, boxe technique, ou repos complet.
          </p>
          <div className="mt-6 grid gap-px bg-[color:var(--color-line)] md:grid-cols-5">
            {FATIGUE_PRESETS.map((preset) => (
              <Link
                key={preset.score}
                href={`/training/${templateSlug}?fatigue=${preset.score}`}
                className="flex flex-col gap-2 bg-[color:var(--color-ash)] p-4 transition-colors hover:bg-black"
              >
                <div className="mono text-2xl font-semibold">{preset.score}</div>
                <div className="label">{preset.label}</div>
                <div className="text-xs text-[color:var(--color-mute)]">{preset.hint}</div>
              </Link>
            ))}
          </div>
        </div>
      </article>
    );
  }

  const resolved = resolveAdaptiveDay(day, fatigueScore);
  return (
    <article className="grid gap-6 bg-[color:var(--color-ash)] p-6 md:grid-cols-[180px_1fr] md:p-8">
      <header>
        <div className="label">{dayName} · J{day.day}</div>
        <h2 className="mt-2 text-xl font-semibold">{resolved.focus}</h2>
        <div className="mono mt-3 text-xs text-[color:var(--color-mute)]">
          Fatigue · {fatigueScore}/10
        </div>
        <Link
          href={`/training/${templateSlug}`}
          className="label mt-4 inline-block text-[color:var(--color-mute)] hover:text-white"
        >
          Changer →
        </Link>
      </header>
      <div className="space-y-6">
        {resolved.blocks.map((block, i) => (
          <BlockCard key={`${block.name}-${i}`} block={block} />
        ))}
      </div>
    </article>
  );
}

function BlockCard({ block }: { block: Block }) {
  return (
    <div className="border border-[color:var(--color-line)] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="label">{block.type}</div>
          <h3 className="mt-1 text-base font-semibold">{block.name}</h3>
        </div>
        <div className="flex items-center gap-3">
          {block.format && <span className="mono text-xs">{block.format}</span>}
          {block.duration && (
            <span className="mono text-xs text-[color:var(--color-mute)]">{block.duration}</span>
          )}
          {block.rounds && (
            <span className="mono text-xs text-[color:var(--color-mute)]">×{block.rounds}</span>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {block.exercises.map((ex, i) => (
          <ExerciseRow key={`${ex.movementId}-${i}`} exercise={ex} />
        ))}
      </ul>

      {block.notes && (
        <p className="mono mt-4 border-t border-[color:var(--color-line)] pt-3 text-xs text-[color:var(--color-mute)]">
          {block.notes}
        </p>
      )}
    </div>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const movement = resolveExerciseMovement(exercise);
  const name = movement?.name ?? exercise.movementId;
  const prescription = formatPrescription(exercise);

  return (
    <li className="grid gap-2 md:grid-cols-[1fr_auto]">
      <div>
        <div className="text-sm">{name}</div>
        {exercise.notes && (
          <div className="mt-1 text-xs text-[color:var(--color-mute)]">{exercise.notes}</div>
        )}
      </div>
      <div className="mono text-xs text-[color:var(--color-mute)] md:text-right">
        {prescription}
      </div>
    </li>
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono mt-1 text-sm">{value}</div>
    </div>
  );
}
