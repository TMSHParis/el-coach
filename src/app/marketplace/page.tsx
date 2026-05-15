import {
  MULTI_PROGRAM_PRICE_CENTS,
  PROGRAM_BASE_PRICE_CENTS,
} from "@/lib/data";
import { TemplateCard } from "@/components/template-card";
import { programTemplates } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Choisis ton programme — EL COACH METHOD" };

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

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

type Tier = {
  label: string;
  priceCents: number;
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    label: "Programme + Coaching Adaptatif",
    priceCents: PROGRAM_BASE_PRICE_CENTS,
    highlight: true,
    features: [
      "Check-in quotidien",
      "Plan adaptatif personnalisé",
      "Stack compléments",
      "Récupération ciblée",
    ],
  },
  {
    label: "Multi-programme + Coaching Adaptatif",
    priceCents: MULTI_PROGRAM_PRICE_CENTS,
    features: [
      "Accès aux 5 programmes",
      "Coaching Adaptatif complet",
      "Historique",
      "Alertes avancées",
    ],
  },
];

function PricingBanner() {
  return (
    <div className="mt-10">
      <div className="grid gap-px bg-[color:var(--color-line)] md:grid-cols-2">
        {TIERS.map((tier) => (
          <div
            key={tier.label}
            className={`flex flex-col gap-4 p-6 ${
              tier.highlight ? "bg-[color:var(--color-accent)]/5" : "bg-[color:var(--color-ash)]"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="label">{tier.label.toUpperCase()}</div>
              {tier.highlight && (
                <span className="mono inline-flex items-center border border-[color:var(--color-accent)] px-2 py-0.5 text-[10px] tracking-[0.25em] text-[color:var(--color-accent)]">
                  RECOMMANDÉ
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="mono text-3xl font-semibold">{formatPrice(tier.priceCents)}</div>
              <div className="label">/mois</div>
            </div>
            <ul className="mt-1 space-y-1.5 text-xs text-[color:var(--color-mute)]">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 select-none">▸</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
