import { coaches } from "@/lib/data";
import { CoachCard } from "@/components/coach-card";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("lg.coaches.meta") };
}

export default async function CoachesPage() {
  const { t } = await getT();
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">{t("lg.coaches.label")}</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        {t("lg.coaches.h1")}
      </h1>
      <p className="mt-4 max-w-xl text-[color:var(--color-mute)]">
        {t("lg.coaches.sub")}
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coaches.map((c) => (
          <CoachCard key={c.slug} coach={c} />
        ))}
      </div>
    </section>
  );
}
