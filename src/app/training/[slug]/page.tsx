import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  formatExerciseLine,
  getTemplate,
  programTemplates,
  resolveAdaptiveDay,
  resolveExerciseMovement,
  type Block,
  type Day,
  type Exercise,
} from "@/lib/programming";
import { getProgramDetailContent, type SessionBlock, type SessionGroup } from "@/lib/program-content";
import { BlockHeader } from "@/components/block-header";

const STATE_STYLES: Record<"VERT" | "JAUNE" | "ROUGE", { bg: string; dot: string; text: string }> = {
  VERT: { bg: "bg-emerald-500/10 border-emerald-500/40", dot: "bg-emerald-400", text: "text-emerald-300" },
  JAUNE: {
    bg: "bg-[color:var(--color-accent)]/10 border-[color:var(--color-accent)]/40",
    dot: "bg-[color:var(--color-accent)]",
    text: "text-[color:var(--color-accent)]",
  },
  ROUGE: { bg: "bg-red-500/10 border-red-500/40", dot: "bg-red-400", text: "text-red-300" },
};

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
  if (!template) return { title: "Programmation introuvable — EL COACH METHOD" };
  return { title: `${template.name} — EL COACH METHOD` };
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
  const content = getProgramDetailContent(slug);

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
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{template.name}</h1>
          <div className="mono mt-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-mute)]">
            · by El Coach Method
          </div>
          {content?.tagline && (
            <div className="mt-1 text-sm italic text-[color:var(--color-mute)]">{content.tagline}</div>
          )}
          <p className="mt-5 max-w-2xl text-[color:var(--color-mute)]">
            {content?.shortDescription ?? template.summary}
          </p>
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

      {content && <ProgramDetailSections content={content} />}

      <div className="mt-20">
        <div className="label text-[color:var(--color-accent)]">[ SEMAINE TYPE ]</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          Détail séance par séance.
        </h2>
      </div>

      {week.theme && (
        <p className="mt-6 border-l-2 border-white pl-4 text-sm text-[color:var(--color-mute)]">
          {week.theme}
        </p>
      )}

      <div className="mt-8 space-y-px bg-[color:var(--color-line)]">
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
          <BlockCard key={`${block.name}-${i}`} block={block} index={i} />
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
          <BlockCard key={`${block.name}-${i}`} block={block} index={i} />
        ))}
      </div>
    </article>
  );
}

function BlockCard({ block, index }: { block: Block; index: number }) {
  return (
    <div className="border border-[color:var(--color-line)] p-5 md:p-6">
      <BlockHeader block={block} index={index} />

      <ul className="mt-5 space-y-1.5">
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
  const { primary, secondary } = formatExerciseLine(exercise, name);

  return (
    <li className="flex items-start gap-2">
      <span aria-hidden className="mt-1 select-none text-[color:var(--color-mute)]">▸</span>
      <div className="flex-1">
        <div className="text-sm leading-snug">{primary}</div>
        {secondary && (
          <div className="mt-0.5 text-xs text-[color:var(--color-mute)]">{secondary}</div>
        )}
      </div>
    </li>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono mt-1 text-sm">{value}</div>
    </div>
  );
}

function ProgramDetailSections({
  content,
}: {
  content: NonNullable<ReturnType<typeof getProgramDetailContent>>;
}) {
  return (
    <>
      <div className="mt-16">
        <div className="label text-[color:var(--color-accent)]">[ STRUCTURE D&apos;UNE SÉANCE ]</div>
        <div className="mt-8 space-y-10">
          {content.sessionGroups.map((group, i) => (
            <SessionGroupCard key={group.title ?? i} group={group} />
          ))}
        </div>
      </div>

      {content.weeklySplit && (
        <div className="mt-16">
          <div className="label text-[color:var(--color-accent)]">[ RÉPARTITION HEBDOMADAIRE ]</div>
          <div className="mt-6 grid grid-cols-2 gap-px bg-[color:var(--color-line)] sm:grid-cols-3 md:grid-cols-6">
            {content.weeklySplit.map((d) => (
              <div key={d.day} className="bg-[color:var(--color-ash)] p-4">
                <div className="label">{d.day}</div>
                <div className="mt-1.5 text-sm">{d.focus}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.extraNote && (
        <div className="mt-16">
          <div className="label text-[color:var(--color-accent)]">[ {content.extraNote.title} ]</div>
          <ul className="mt-4 space-y-1.5">
            {content.extraNote.lines.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-[color:var(--color-mute)]">
                <span aria-hidden className="mt-1 select-none">▸</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-16">
        <div className="label text-[color:var(--color-accent)]">
          [ CE QUE LE COACHING ADAPTATIF FAIT AVEC CE PROGRAMME ]
        </div>
        <div className="mt-6 space-y-3">
          {content.adaptiveStates.map((s) => {
            const style = STATE_STYLES[s.level];
            return (
              <div
                key={s.level}
                className={`flex items-center gap-4 border p-4 ${style.bg}`}
              >
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                <div>
                  <div className={`mono text-[10px] tracking-[0.3em] ${style.text}`}>{s.level}</div>
                  <div className="mt-1 text-sm">{s.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12">
        <Link href={`/signup?program=${content.slug}`} className="btn-primary">
          {content.ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}

function SessionGroupCard({ group }: { group: SessionGroup }) {
  return (
    <div>
      {group.title && (
        <div className="mono mb-4 text-xs uppercase tracking-[0.15em] text-white">{group.title}</div>
      )}
      <div className="space-y-4">
        {group.blocks.map((block, i) => (
          <SessionBlockRow key={`${block.label}-${i}`} block={block} />
        ))}
      </div>
    </div>
  );
}

function SessionBlockRow({ block }: { block: SessionBlock }) {
  return (
    <div className="border border-[color:var(--color-line)] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{block.label}</span>
        {block.tags?.map((tag) => (
          <span
            key={tag}
            className="mono rounded-none border border-[color:var(--color-line)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[color:var(--color-mute)]"
          >
            {tag}
          </span>
        ))}
        {block.duration && (
          <span className="mono text-[10px] text-[color:var(--color-mute)]">· {block.duration}</span>
        )}
      </div>
      {block.description && (
        <p className="mt-2 text-sm text-[color:var(--color-mute)]">{block.description}</p>
      )}
    </div>
  );
}
