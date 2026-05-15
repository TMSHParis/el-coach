import {
  MULTI_AI_PRICE_CENTS,
  PROGRAM_AI_PRICE_CENTS,
  PROGRAM_BASE_PRICE_CENTS,
} from "@/lib/data";
import { TemplateCard } from "@/components/template-card";
import { programTemplates } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Choisis ton programme — EL COACH METHOD" };

export default function MarketplacePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label text-[color:var(--color-accent)]">[ COACH IA · NOUVELLE GÉNÉRATION ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        Choisis ton programme.
        <br />
        L&apos;IA s&apos;occupe du reste.
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        Les 5 programmes sont la base. Le coach IA adapte ta séance, ton stack et ton en-cas
        chaque matin selon ton état réel.
      </p>

      <PricingBanner />

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programTemplates.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-[color:var(--color-mute)]">
        Sans engagement. Annulation en un clic. 7 jours offerts.
      </p>
    </section>
  );
}

type Tier = {
  label: string;
  priceCents: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    label: "Programme seul",
    priceCents: PROGRAM_BASE_PRICE_CENTS,
    tagline: "Un programme · sans coach IA",
    features: [
      "Accès complet à 1 programme",
      "Séances figées, intensité standard",
      "Suivi manuel",
    ],
  },
  {
    label: "Programme + Coach IA",
    priceCents: PROGRAM_AI_PRICE_CENTS,
    tagline: "Le plan du jour, sur mesure",
    highlight: true,
    features: [
      "1 programme + check-in matinal",
      "Séance, stack, en-cas adaptés chaque jour",
      "Analyse sommeil Apple Watch",
      "Adaptation blessures + jeûne",
    ],
  },
  {
    label: "Multi + Coach IA",
    priceCents: MULTI_AI_PRICE_CENTS,
    tagline: "Tous les programmes, l'IA arbitre",
    features: [
      "Accès aux 5 programmes",
      "IA croise les disciplines selon ton état",
      "Historique complet et tendances 7 jours",
      "Alertes hormonales & récupération",
    ],
  },
];

function PricingBanner() {
  return (
    <div className="mt-10">
      <div className="grid gap-px bg-[color:var(--color-line)] md:grid-cols-3">
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
            <div>
              <div className="flex items-baseline gap-2">
                <div className="mono text-3xl font-semibold">{formatPrice(tier.priceCents)}</div>
                <div className="label">/mois</div>
              </div>
              <p className="mt-2 text-sm text-[color:var(--color-mute)]">{tier.tagline}</p>
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
      <p className="mono mt-4 text-center text-[10px] tracking-[0.25em] text-[color:var(--color-mute)]">
        Tarifs Coach IA à valider · estimation coût API ~0,60 € / utilisateur / mois
      </p>
    </div>
  );
}
