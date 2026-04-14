import { programs } from "@/lib/data";
import { ProgramCard } from "@/components/program-card";

export const metadata = { title: "Marketplace — EL COACH" };

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

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ MARKETPLACE ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        Tous les programmes
      </h1>
      <p className="mt-4 max-w-xl text-[color:var(--color-mute)]">
        {filtered.length} programme(s) disponibles. Chaque plan est écrit et signé par un coach
        vérifié.
      </p>

      <div className="mt-10 hairline grid grid-cols-2 divide-x divide-[color:var(--color-line)] md:grid-cols-6">
        <FilterLink label="TOUS" href="/marketplace" active={!cat} />
        {categories.map((c) => (
          <FilterLink key={c} label={c} href={`/marketplace?cat=${c}`} active={cat === c} />
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProgramCard key={p.slug} program={p} />
        ))}
      </div>
    </section>
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
