import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgramIcon } from "@/components/program-icon";
import { programTemplates } from "@/lib/programming";
import { getT } from "@/lib/i18n/server";
import { tc } from "@/lib/i18n/content";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.onboarding") };
}

export default async function OnboardingPage() {
  const { t: tr, lang } = await getT();
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="mono inline-flex items-center gap-2 border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
        {tr("su.onb.badge")}
      </div>
      <h1 className="gold-shimmer mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
        {tr("su.onb.title")}
      </h1>
      <p className="mt-6 max-w-xl text-base text-[color:var(--color-mute)] md:text-lg">
        {tr("su.onb.body")}
        <br />
        {tr("su.onb.change")}
      </p>

      <div className="mt-12 grid gap-px bg-[color:var(--color-line)] md:grid-cols-2">
        {programTemplates.map((t) => (
          <Link
            key={t.slug}
            href={`/signup?program=${t.slug}`}
            className="group flex w-full flex-col gap-5 bg-[color:var(--color-ash)] p-8 text-left transition-colors hover:bg-black md:p-10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-white">
                  <ProgramIcon template={t} size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold md:text-3xl">{t.name}</h2>
                  <div className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-mute)]">
                    · by El Coach Method
                  </div>
                  {t.tagline && (
                    <div className="mt-1 text-xs italic text-[color:var(--color-mute)]">
                      {tc(lang, t.tagline)}
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              />
            </div>
            <p className="text-sm text-[color:var(--color-mute)]">{tc(lang, t.summary)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
