import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { programTemplates, type ProgramTemplate } from "@/lib/programming";
import { getT } from "@/lib/i18n/server";
import type { Lang, Translate } from "@/lib/i18n";
import { tc } from "@/lib/i18n/content";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("lg.training.meta") };
}

const DISCIPLINE_LABEL = {
  crossfit: "lg.training.disc.crossfit",
  hybrid: "lg.training.disc.hybrid",
  hyrox: "lg.training.disc.hyrox",
  home: "lg.training.disc.home",
  hypertrophy: "lg.training.disc.hypertrophy",
} as const satisfies Record<ProgramTemplate["discipline"], string>;

export default async function TrainingIndexPage() {
  const { t, lang } = await getT();
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">{t("lg.training.label")}</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        {t("lg.training.h1")}
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        {t("lg.training.intro")}
      </p>

      <div className="mt-12 grid gap-px bg-[color:var(--color-line)] md:grid-cols-2">
        {programTemplates.map((tpl) => (
          <TemplateCard key={tpl.slug} template={tpl} t={t} lang={lang} />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({ template, t, lang }: { template: ProgramTemplate; t: Translate; lang: Lang }) {
  const sessionsPerWeek = template.weeks[0]?.days.filter((d) => d.blocks.length > 0).length ?? 0;
  return (
    <Link
      href={`/training/${template.slug}`}
      className="group relative flex flex-col gap-6 bg-[color:var(--color-ash)] p-8 transition-colors hover:bg-black md:p-10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label">[ {t(DISCIPLINE_LABEL[template.discipline])} ]</div>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{template.name}</h2>
        </div>
        <ArrowUpRight
          size={20}
          className="mt-1 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>

      <p className="text-sm text-[color:var(--color-mute)]">{tc(lang, template.summary)}</p>

      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-5">
        <Meta label={t("lg.training.days")} value={t("lg.perWeek", { n: sessionsPerWeek })} />
        <Meta label={t("lg.training.level")} value={template.level} />
        <Meta label={t("lg.training.weeks")} value={t("lg.training.weeksAvail", { n: template.weeks.length })} />
      </div>
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono mt-1 text-sm uppercase">{value}</div>
    </div>
  );
}
