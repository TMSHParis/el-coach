import {
  PROGRAM_BASE_PRICE_CENTS,
  PROGRAM_ADDITIONAL_PRICE_CENTS,
} from "@/lib/data";
import { TemplateCard } from "@/components/template-card";
import { programTemplates } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Choisis ton programme — EL COACH METHOD" };

export default function MarketplacePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
        5 programmes. Un seul coach. Zéro compromis.
      </h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-mute)]">
        Chaque plan est écrit, structuré et signé. Tu choisis, tu t&apos;entraînes.
      </p>

      <PricingBanner />

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programTemplates.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-[color:var(--color-mute)]">
        Sans engagement. Annulation en un clic.
      </p>
    </section>
  );
}

function PricingBanner() {
  return (
    <div className="mt-10 grid gap-4 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] p-6 md:grid-cols-[1fr_auto_1fr]">
      <div>
        <div className="label">PROGRAMME PRINCIPAL</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="mono text-3xl font-semibold">{formatPrice(PROGRAM_BASE_PRICE_CENTS)}</div>
          <div className="label">/mois</div>
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-mute)]">
          Accès complet à ta programmation. Suivi quotidien, progression mesurable.
        </div>
      </div>
      <div className="hidden items-center justify-center md:flex">
        <span className="mono text-2xl text-[color:var(--color-mute)]">+</span>
      </div>
      <div>
        <div className="label">PROGRAMME ADDITIONNEL</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="mono text-3xl font-semibold">
            {formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS)}
          </div>
          <div className="label">/mois</div>
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-mute)]">
          Ajoute un programme à tout moment. Même tarif, sans limite.
        </div>
      </div>
    </div>
  );
}
