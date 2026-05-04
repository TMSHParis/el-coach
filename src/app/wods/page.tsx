import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WODS, WOD_CATEGORY_LABEL, type WodCategory } from "@/lib/wods";

export const metadata = { title: "WOD Library — EL COACH METHOD" };

const CATEGORIES: WodCategory[] = ["girls", "heroes", "benchmark"];

export default async function WodsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const filtered = cat
    ? WODS.filter((w) => w.category === cat)
    : WODS;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ WOD LIBRARY ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        Tous les WODs nommés.
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        {WODS.length} WODs benchmarks et hommages. Chaque WOD a son histoire,
        son scheme, son time cap. Lance n&apos;importe lequel comme séance one-shot.
      </p>

      <div className="mt-10 hairline grid grid-cols-2 divide-x divide-[color:var(--color-line)] md:grid-cols-4">
        <FilterLink label="TOUS" href="/wods" active={!cat} />
        {CATEGORIES.map((c) => (
          <FilterLink
            key={c}
            label={WOD_CATEGORY_LABEL[c].toUpperCase()}
            href={`/wods?cat=${c}`}
            active={cat === c}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((wod) => (
          <Link
            key={wod.slug}
            href={`/wods/${wod.slug}`}
            className="card grain flex flex-col gap-4 p-6 transition-colors hover:bg-black"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="label">{WOD_CATEGORY_LABEL[wod.category]}</div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                  {wod.name}
                </h3>
              </div>
              <ArrowUpRight size={18} className="opacity-60" />
            </div>
            <div className="mono text-xs text-[color:var(--color-mute)]">{wod.scheme}</div>
            <p className="text-sm text-[color:var(--color-mute)] line-clamp-3">
              {wod.description}
            </p>
            {wod.timeCap && (
              <div className="mono mt-auto text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-mute)]">
                Time cap · {wod.timeCap}
              </div>
            )}
          </Link>
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
