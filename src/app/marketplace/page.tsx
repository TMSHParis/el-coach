import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  programs,
  PROGRAM_BASE_PRICE_CENTS,
  PROGRAM_ADDITIONAL_PRICE_CENTS,
} from "@/lib/data";
import { ProgramCard } from "@/components/program-card";
import { programTemplates, type ProgramTemplate } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Explorer les programmes — EL COACH" };

const categories = ["STRENGTH", "HYPERTROPHY", "CONDITIONING", "ENDURANCE", "MOBILITY"] as const;

const TEMPLATE_DISCIPLINE_LABEL: Record<ProgramTemplate["discipline"], string> = {
  crossfit: "CrossFit pure",
  hybrid: "Hybrid Engine",
  hyrox: "Hyrox pure",
  home: "À la maison",
  hypertrophy: "Hypertrophy · Volume Block",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; level?: string }>;
}) {
  const { cat, level } = await searchParams;
  const filtered = programs.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (level && p.level !== level) return false;
    return true;
  });

  // Les programmations training restent visibles tant qu'aucun filtre catégorie
  // marketplace n'est appliqué (elles n'ont pas de catégorie marketplace).
  const showTemplates = !cat;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ EXPLORER LES PROGRAMMES ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        Tous les programmes
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        {filtered.length + (showTemplates ? programTemplates.length : 0)} programmes accessibles directement.
        Chaque plan est écrit et signé par un coach vérifié, ou inclus dans la base programmations.
      </p>

      <PricingBanner />

      <div className="mt-10 hairline grid grid-cols-2 divide-x divide-[color:var(--color-line)] md:grid-cols-6">
        <FilterLink label="TOUS" href="/marketplace" active={!cat} />
        {categories.map((c) => (
          <FilterLink key={c} label={c} href={`/marketplace?cat=${c}`} active={cat === c} />
        ))}
      </div>

      {showTemplates && (
        <>
          <SectionTitle
            title="Programmations de base"
            subtitle={`${programTemplates.length} programmations signées EL COACH · accès direct`}
          />
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programTemplates.map((t) => (
              <TemplateCard key={t.slug} template={t} />
            ))}
          </div>
        </>
      )}

      <SectionTitle
        title="Programmes coachs"
        subtitle={`${filtered.length} programmes par des coachs vérifiés`}
      />
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProgramCard key={p.slug} program={p} />
        ))}
      </div>
    </section>
  );
}

function PricingBanner() {
  return (
    <div className="mt-8 grid gap-4 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] p-6 md:grid-cols-[1fr_auto_1fr]">
      <div>
        <div className="label">PROGRAMME PRINCIPAL</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="mono text-3xl font-semibold">{formatPrice(PROGRAM_BASE_PRICE_CENTS)}</div>
          <div className="label">/mois</div>
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-mute)]">
          Tarif unique pour ton premier programme.
        </div>
      </div>
      <div className="hidden items-center justify-center md:flex">
        <span className="mono text-2xl text-[color:var(--color-mute)]">+</span>
      </div>
      <div>
        <div className="label">CHAQUE PROGRAMME ADDITIONNEL</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="mono text-3xl font-semibold">
            {formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS)}
          </div>
          <div className="label">/mois</div>
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-mute)]">
          Cumule autant de programmes que tu veux.
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-14 flex flex-wrap items-end justify-between gap-2 border-b border-[color:var(--color-line)] pb-3">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <span className="mono text-xs text-[color:var(--color-mute)]">{subtitle}</span>
    </div>
  );
}

function TemplateCard({ template }: { template: ProgramTemplate }) {
  const sessionsPerWeek = template.weeks[0]?.days.filter((d) => d.blocks.length > 0).length ?? 0;
  return (
    <Link
      href={`/training/${template.slug}`}
      className="card grain flex flex-col justify-between p-6 transition-colors hover:bg-black"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="label">{TEMPLATE_DISCIPLINE_LABEL[template.discipline]}</span>
          <ArrowUpRight size={16} className="opacity-60" />
        </div>
        <h3 className="mt-6 text-xl font-semibold leading-tight tracking-tight">
          {template.name}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm text-[color:var(--color-mute)]">
          {template.summary}
        </p>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-4">
        <Stat label="JOURS" value={`${sessionsPerWeek}/sem`} />
        <Stat label="NIVEAU" value={template.level.slice(0, 3).toUpperCase()} />
        <Stat label="SEMAINES" value={`${template.weeks.length}`} />
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="label">Programmation</div>
          <div className="mono text-sm">EL COACH</div>
        </div>
        <div className="text-right">
          <div className="mono text-2xl font-semibold">
            {formatPrice(PROGRAM_BASE_PRICE_CENTS)}
          </div>
          <div className="label">/mois</div>
          <div className="mono mt-1 text-[10px] text-[color:var(--color-mute)]">
            +{formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS)} / programme additionnel
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono text-sm">{value}</div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`label px-4 py-3 text-center transition-colors ${
        active ? "bg-white text-black" : "hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}
