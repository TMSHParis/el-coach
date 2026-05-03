import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getDemoState,
  resolveTodaySession,
  DAY_FULL_NAMES,
} from "@/lib/demo-session";
import { getWod } from "@/lib/wods";
import SessionRunner from "./session-runner";

export const metadata = { title: "Séance en cours — EL COACH" };

export default async function SessionRunnerPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; wod?: string }>;
}) {
  const { day: dayParam, wod: wodParam } = await searchParams;

  // Cas 1 : un WOD nommé est demandé → séance one-shot.
  if (wodParam) {
    const wod = getWod(wodParam);
    if (!wod) redirect("/wods");
    return (
      <SessionRunner
        initialBlocks={[wod.block]}
        templateName="WOD Library"
        dayLabel={wod.name}
        focus={wod.scheme}
        estimatedMinutes={0}
      />
    );
  }

  const demo = await getDemoState();

  if (!demo.programSlug) redirect("/onboarding");

  const overrideDay = dayParam ? Number(dayParam) : undefined;
  const validOverride =
    overrideDay !== undefined && overrideDay >= 1 && overrideDay <= 7
      ? overrideDay
      : undefined;

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore, validOverride);
  if (!today) redirect("/dashboard");

  if (today.needsFatigueInput) {
    return <FatigueBlocker />;
  }

  if (today.day.blocks.length === 0) {
    return <RestBlocker />;
  }

  return (
    <SessionRunner
      initialBlocks={today.day.blocks}
      templateName={today.template.name}
      dayLabel={DAY_FULL_NAMES[today.dayNumber - 1]}
      focus={today.day.focus}
      estimatedMinutes={today.day.estimatedMinutes}
    />
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
      <Link href="/dashboard" className="btn-primary mt-8 inline-flex">
        Retour dashboard
      </Link>
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
      <Link href="/dashboard" className="btn-primary mt-8 inline-flex">
        Retour dashboard
      </Link>
    </section>
  );
}
