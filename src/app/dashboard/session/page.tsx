import Link from "next/link";
import { redirect } from "next/navigation";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { getWod } from "@/lib/wods";
import SessionRunner from "./session-runner";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("lg.run.meta") };
}

const DAY_KEYS = [
  "lg.day.1",
  "lg.day.2",
  "lg.day.3",
  "lg.day.4",
  "lg.day.5",
  "lg.day.6",
  "lg.day.7",
] as const;

export default async function SessionRunnerPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; wod?: string }>;
}) {
  const { day: dayParam, wod: wodParam } = await searchParams;
  const { t } = await getT();

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
    return <FatigueBlocker t={t} />;
  }

  if (today.day.blocks.length === 0) {
    return <RestBlocker t={t} />;
  }

  return (
    <SessionRunner
      initialBlocks={today.day.blocks}
      templateName={today.template.name}
      dayLabel={t(DAY_KEYS[(today.dayNumber - 1) % 7])}
      focus={today.day.focus}
      estimatedMinutes={today.day.estimatedMinutes}
    />
  );
}

function FatigueBlocker({ t }: { t: Translate }) {
  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="label">{t("lg.run.cooldownLabel")}</div>
      <h1 className="mt-4 text-3xl font-semibold">{t("lg.run.fatigueFirst")}</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        {t("lg.run.fatigueBody")}
      </p>
      <Link href="/dashboard" className="btn-primary mt-8 inline-flex">
        {t("lg.backDashboard")}
      </Link>
    </section>
  );
}

function RestBlocker({ t }: { t: Translate }) {
  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="label">{t("lg.run.restLabel")}</div>
      <h1 className="mt-4 text-3xl font-semibold">{t("lg.run.restTitle")}</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        {t("lg.run.restBody")}
      </p>
      <Link href="/dashboard" className="btn-primary mt-8 inline-flex">
        {t("lg.backDashboard")}
      </Link>
    </section>
  );
}
