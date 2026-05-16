import Link from "next/link";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { TemplateCard } from "@/components/template-card";
import { programTemplates } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Choisis ton programme — EL COACH METHOD" };

const FEATURES = [
  "Check-in quotidien",
  "Plan adaptatif personnalisé",
  "Stack compléments",
  "Séance adaptée",
  "Récupération ciblée",
  "Alertes",
  "Aperçu demain",
];

export default function MarketplacePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label text-[color:var(--color-accent)]">[ COACHING ADAPTATIF · PAR EL COACH METHOD ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        5 programmes. Un Coaching Adaptatif. Zéro générique.
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        Chaque plan généré en temps réel selon ton état du jour.
      </p>

      <PricingBanner />

      <div className="mt-12">
        <div className="label text-[color:var(--color-accent)]">[ LES 5 PROGRAMMES ]</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          La base que ton Coaching Adaptatif utilise.
        </h2>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programTemplates.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-[color:var(--color-mute)]">
        Sans engagement. Annulation en un clic. Free Trial 7 jours.
      </p>
    </section>
  );
}

function PricingBanner() {
  return (
    <div className="mt-10 grid gap-6 border border-[color:var(--color-line)] bg-[color:var(--color-accent)]/5 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
      <div>
        <div className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          ◆ COACHING ADAPTATIF — EL COACH METHOD
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <div className="mono text-5xl font-semibold">{formatPrice(PROGRAM_BASE_PRICE_CENTS)}</div>
          <div className="label">/mois</div>
        </div>
        <ul className="mt-5 grid gap-1.5 text-sm text-[color:var(--color-mute)] sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 select-none text-[color:var(--color-accent)]">▸</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mono mt-5 inline-flex items-center gap-2 border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          ✦ FREE TRIAL — 7 JOURS OFFERTS
        </div>
        <div className="mono mt-3 text-[10px] text-[color:var(--color-mute)]">
          Sans engagement · Annulation en un clic
        </div>
      </div>
      <div className="flex md:flex-col md:items-end md:gap-3">
        <Link href="/signup" className="btn-primary justify-center">
          Commencer mon check-in →
        </Link>
      </div>
    </div>
  );
}
