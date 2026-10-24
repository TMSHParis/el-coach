import { notFound } from "next/navigation";
import { MapPin, Star, Users } from "lucide-react";
import { getCoach, getProgramsByCoach, coaches } from "@/lib/data";
import { ProgramCard } from "@/components/program-card";
import { getT } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/i18n";

export function generateStaticParams() {
  return coaches.map((c) => ({ slug: c.slug }));
}

export default async function CoachPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const coach = getCoach(slug);
  if (!coach) notFound();
  const { t, lang } = await getT();
  const coachPrograms = getProgramsByCoach(coach.slug);

  return (
    <>
      <section className="hairline-b relative overflow-hidden">
        <div className="grain mx-auto max-w-7xl px-6 py-16">
          <div className="label">{t("lg.coach.label", { slug: coach.slug.toUpperCase() })}</div>
          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{coach.name}</h1>
              <div className="mono mt-3 text-[color:var(--color-mute)]">{coach.title}</div>
            </div>
            <div className="flex gap-6">
              <Stat icon={<Star size={14} />} label={t("lg.coach.rating")} value={formatNumber(lang, coach.rating, { minimumFractionDigits: 0 })} />
              <Stat icon={<Users size={14} />} label={t("lg.coach.athletes")} value={`${coach.athletes}`} />
              <Stat icon={<MapPin size={14} />} label={t("lg.coach.loc")} value={coach.location} />
            </div>
          </div>
          <p className="mt-8 max-w-2xl text-[color:var(--color-mute)]">{coach.bio}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {coach.specialties.map((s) => (
              <span key={s} className="label border border-[color:var(--color-line)] px-3 py-1.5">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="label">{t("lg.coach.programs")}</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("lg.coach.signedBy", { name: coach.name.split(" ")[0] })}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coachPrograms.map((p) => (
            <ProgramCard key={p.slug} program={p} />
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono mt-1 flex items-center gap-2 text-lg">
        {icon} {value}
      </div>
    </div>
  );
}
