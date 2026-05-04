import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { getWod, WODS, WOD_CATEGORY_LABEL } from "@/lib/wods";
import {
  blockLetter,
  formatExerciseLine,
  resolveExerciseMovement,
  type Exercise,
} from "@/lib/programming";
import { BlockHeader } from "@/components/block-header";

export function generateStaticParams() {
  return WODS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wod = getWod(slug);
  return {
    title: wod ? `${wod.name} — WOD · EL COACH METHOD` : "WOD introuvable — EL COACH METHOD",
  };
}

export default async function WodDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wod = getWod(slug);
  if (!wod) notFound();

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/wods"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        <ArrowLeft size={14} /> Toute la WOD library
      </Link>

      <header className="mt-8">
        <div className="label">{WOD_CATEGORY_LABEL[wod.category]}</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-7xl">
          {wod.name}
        </h1>
        <div className="mono mt-3 text-sm text-[color:var(--color-mute)]">
          {wod.scheme}
          {wod.timeCap && <> · time cap {wod.timeCap}</>}
        </div>
        <p className="mt-6 text-base text-[color:var(--color-mute)] md:text-lg">
          {wod.description}
        </p>
      </header>

      <div className="mt-10 card p-6 md:p-8">
        <BlockHeader block={wod.block} letter={blockLetter(0)} />

        <ul className="mt-5 space-y-1.5 pl-12">
          {wod.block.exercises.map((ex, i) => (
            <ExerciseLineDisplay key={`${ex.movementId}-${i}`} exercise={ex} />
          ))}
        </ul>

        {wod.block.notes && (
          <p className="mono mt-5 border-t border-[color:var(--color-line)] pt-4 pl-12 text-xs text-[color:var(--color-mute)]">
            {wod.block.notes}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/session?wod=${wod.slug}`}
          className="btn-primary justify-center"
        >
          <Play size={14} /> Lancer ce WOD maintenant
        </Link>
        <Link href="/wods" className="btn-ghost justify-center">
          Choisir un autre WOD
        </Link>
      </div>
    </section>
  );
}

function ExerciseLineDisplay({ exercise }: { exercise: Exercise }) {
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
