import {
  programs,
  PROGRAM_BASE_PRICE_CENTS,
  PROGRAM_ADDITIONAL_PRICE_CENTS,
} from "@/lib/data";
import { ProgramCard } from "@/components/program-card";
import { TemplateCard } from "@/components/template-card";
import { programTemplates } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Explorer les programmes — EL COACH" };

const categories = ["STRENGTH", "HYPERTROPHY", "CONDITIONING", "ENDURANCE", "MOBILITY"] as const;

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
