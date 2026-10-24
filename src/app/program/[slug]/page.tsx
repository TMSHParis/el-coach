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
import { getT } from "@/lib/i18n/server";

export function generateStaticParams() {
  return programs.map((p) => ({ slug: p.slug }));
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getProgram(slug);
  if (!program) notFound();
  const { t, lang } = await getT();
  const coach = getCoach(program.coachSlug);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">{t("lg.program.label", { cat: program.category })}</div>
      <div className="mt-6 grid gap-12 md:grid-cols-[1.6fr_1fr]">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{program.title}</h1>
          {coach && (
            <Link href={`/coach/${coach.slug}`} className="mono mt-4 inline-block text-[color:var(--color-mute)] hover:text-white">
              {t("lg.program.by", { name: coach.name })}
            </Link>
          )}
          <p className="mt-8 text-lg text-[color:var(--color-mute)]">{program.description}</p>

          <div className="mt-12">
            <div className="label">{t("lg.program.outcomes")}</div>
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
            <div className="label">{t("lg.program.equipment")}</div>
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
          <div className="label">{t("lg.program.subscription")}</div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="mono text-5xl font-semibold">{formatPrice(program.priceCents, "EUR", lang)}</div>
            <div className="label">{program.priceIntervalLabel === "/mois" ? t("lg.perMonth") : program.priceIntervalLabel}</div>
          </div>
          <div className="mono mt-2 text-xs text-[color:var(--color-mute)]">
            {t("lg.program.additional", { price: formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS, "EUR", lang) })}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-4">
            <Meta label={t("lg.program.duration")} value={t("lg.program.durationValue", { n: program.weeks })} />
            <Meta label={t("lg.program.sessions")} value={t("lg.perWeek", { n: program.sessionsPerWeek })} />
            <Meta label={t("lg.program.level")} value={program.level} />
          </div>
          <div className="mt-8">
            <CheckoutButton programSlug={program.slug} programTitle={program.title} />
          </div>
          <ul className="mt-6 space-y-2 text-sm text-[color:var(--color-mute)]">
            <li className="flex items-center gap-2">
              <Check size={14} /> {t("lg.program.perk1")}
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> {t("lg.program.perk2")}
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> {t("lg.program.perk3")}
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> {t("lg.program.perk4", { price: formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS, "EUR", lang) })}
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
