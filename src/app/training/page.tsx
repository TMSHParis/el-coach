import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { programTemplates, type ProgramTemplate } from "@/lib/programming";

export const metadata = { title: "Programmations — EL COACH METHOD" };

const DISCIPLINE_LABEL: Record<ProgramTemplate["discipline"], string> = {
  crossfit: "CrossFit pure",
  hybrid: "Hybrid Engine",
  hyrox: "Hyrox pure",
  home: "À la maison",
  hypertrophy: "Hypertrophy · Volume Block",
};

export default function TrainingIndexPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ PROGRAMMATIONS ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        4 systèmes, 1 moteur.
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        Programmations signées, basées sur une base de mouvements unifiée
        (CrossFit Open/Games, stations Hyrox officielles, accessoires home).
        Chaque semaine-type est déployable en cycle de 4, 8 ou 12 semaines.
      </p>

      <div className="mt-12 grid gap-px bg-[color:var(--color-line)] md:grid-cols-2">
        {programTemplates.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({ template }: { template: ProgramTemplate }) {
  const sessionsPerWeek = template.weeks[0]?.days.filter((d) => d.blocks.length > 0).length ?? 0;
  return (
    <Link
      href={`/training/${template.slug}`}
      className="group relative flex flex-col gap-6 bg-[color:var(--color-ash)] p-8 transition-colors hover:bg-black md:p-10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label">[ {DISCIPLINE_LABEL[template.discipline]} ]</div>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{template.name}</h2>
        </div>
        <ArrowUpRight
          size={20}
          className="mt-1 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>

      <p className="text-sm text-[color:var(--color-mute)]">{template.summary}</p>

      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-5">
        <Meta label="JOURS" value={`${sessionsPerWeek}/sem`} />
        <Meta label="NIVEAU" value={template.level} />
        <Meta label="SEMAINES" value={`${template.weeks.length} dispo`} />
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
