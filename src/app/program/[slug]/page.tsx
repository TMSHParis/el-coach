import { notFound } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import {
  getProgram,
  getCoach,
  programs,
  PROGRAM_ADDITIONAL_PRICE_CENTS,
} from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";

export function generateStaticParams() {
  return programs.map((p) => ({ slug: p.slug }));
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getProgram(slug);
  if (!program) notFound();
  const coach = getCoach(program.coachSlug);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ PROGRAMME / {program.category} ]</div>
      <div className="mt-6 grid gap-12 md:grid-cols-[1.6fr_1fr]">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{program.title}</h1>
          {coach && (
            <Link href={`/coach/${coach.slug}`} className="mono mt-4 inline-block text-[color:var(--color-mute)] hover:text-white">
              par {coach.name} →
            </Link>
          )}
          <p className="mt-8 text-lg text-[color:var(--color-mute)]">{program.description}</p>

          <div className="mt-12">
            <div className="label">[ RÉSULTATS ATTENDUS ]</div>
            <ul className="mt-4 space-y-3">
              {program.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-3">
                  <Check size={18} className="mt-0.5 shrink-0" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <div className="label">[ MATÉRIEL REQUIS ]</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {program.equipment.map((e) => (
                <span key={e} className="label border border-[color:var(--color-line)] px-3 py-1.5">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="card grain h-fit p-8">
          <div className="label">ABONNEMENT</div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="mono text-5xl font-semibold">{formatPrice(program.priceCents)}</div>
            <div className="label">{program.priceIntervalLabel}</div>
          </div>
          <div className="mono mt-2 text-xs text-[color:var(--color-mute)]">
            +{formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS)}/mois par programme additionnel
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-4">
            <Meta label="DURÉE" value={`${program.weeks}sem`} />
            <Meta label="SÉANCES" value={`${program.sessionsPerWeek}/sem`} />
            <Meta label="NIVEAU" value={program.level} />
          </div>
          <div className="mt-8">
            <CheckoutButton programSlug={program.slug} programTitle={program.title} />
          </div>
          <ul className="mt-6 space-y-2 text-sm text-[color:var(--color-mute)]">
            <li className="flex items-center gap-2">
              <Check size={14} /> Annulation à tout moment
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Séances quotidiennes détaillées
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Suivi PR & progression
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Cumul de programmes : {formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS)}/mois en plus chacun
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono mt-1 text-sm">{value}</div>
    </div>
  );
}
