import { Check } from "lucide-react";
import { ApplyForm } from "./apply-form";

export const metadata = { title: "Devenir coach — EL COACH METHOD" };

export default function ApplyPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="label">[ DEVENIR COACH ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        Publie ton système.
        <br />
        <span className="text-[#8a8a8a]">Garde 80% des revenus.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-[#8a8a8a]">
        On sélectionne les coachs à la main. Candidature lue sous 72h. Paiement mensuel via Stripe
        Connect une fois validé. Tu gardes la propriété intellectuelle de tes programmes.
      </p>

      <div className="mt-10 grid gap-px bg-[#1f1f1f] md:grid-cols-3">
        <Perk title="80% de revenu" body="Commission plateforme fixée à 20%. Paiement hebdo." />
        <Perk title="Ton branding" body="Page coach, handle, stats publiques. Aucune marque imposée." />
        <Perk title="Outils inclus" body="Éditeur de programmes, suivi athlètes, stats rétention." />
      </div>

      <ApplyForm />
    </section>
  );
}

function Perk({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[#0a0a0a] p-6">
      <Check size={16} />
      <div className="mono mt-4 text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm text-[#8a8a8a]">{body}</p>
    </div>
  );
}
