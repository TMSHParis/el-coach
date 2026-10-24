import Link from "next/link";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { TemplateCard } from "@/components/template-card";
import { programTemplates } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import type { Lang, Translate } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("lg.mkt.meta") };
}

const FEATURES = ["lg.mkt.f1", "lg.mkt.f2", "lg.mkt.f3", "lg.mkt.f4", "lg.mkt.f5", "lg.mkt.f6", "lg.mkt.f7"] as const;

export default async function MarketplacePage() {
  const { t, lang } = await getT();
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label text-[color:var(--color-accent)]">{t("lg.mkt.label")}</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        {t("lg.mkt.h1")}
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        {t("lg.mkt.sub")}
      </p>

      <PricingBanner t={t} lang={lang} />

      <div className="mt-12">
        <div className="label text-[color:var(--color-accent)]">{t("lg.mkt.listLabel")}</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          {t("lg.mkt.listTitle")}
        </h2>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programTemplates.map((t) => (
          <TemplateCard key={t.slug} template={t} lang={lang} />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-[color:var(--color-mute)]">
        {t("lg.mkt.footer")}
      </p>
    </section>
  );
}

function PricingBanner({ t, lang }: { t: Translate; lang: Lang }) {
  return (
    <div className="mt-10 grid gap-6 border border-[color:var(--color-line)] bg-[color:var(--color-accent)]/5 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
      <div>
        <div className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          {t("lg.mkt.bannerTag")}
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <div className="mono text-5xl font-semibold">{formatPrice(PROGRAM_BASE_PRICE_CENTS, "EUR", lang)}</div>
          <div className="label">{t("lg.perMonth")}</div>
        </div>
        <ul className="mt-5 grid gap-1.5 text-sm text-[color:var(--color-mute)] sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 select-none text-[color:var(--color-accent)]">▸</span>
              <span>{t(f)}</span>
            </li>
          ))}
        </ul>
        <div className="mono mt-5 inline-flex items-center gap-2 border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          {t("lg.mkt.trial")}
        </div>
        <div className="mono mt-3 text-[10px] text-[color:var(--color-mute)]">
          {t("lg.mkt.noCommit")}
        </div>
      </div>
      <div className="flex md:flex-col md:items-end md:gap-3">
        <Link href="/signup" className="btn-primary justify-center">
          {t("lg.mkt.cta")}
        </Link>
      </div>
    </div>
  );
}
