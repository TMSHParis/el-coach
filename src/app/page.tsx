import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgramIcon } from "@/components/program-icon";
import {
  PROGRAM_BASE_PRICE_CENTS,
  PROGRAM_ADDITIONAL_PRICE_CENTS,
} from "@/lib/data";
import { programTemplates, type ProgramTemplate } from "@/lib/programming";
import { formatPrice } from "@/lib/utils";

export default function Home() {
  const featured = programTemplates;
  return (
    <>
      <Hero />
      <Ticker />
      <Featured featured={featured} />
      <Pillars />
      <How />
      <CTA />
    </>
  );
}

function Hero() {
  return (
    <section className="hairline-b relative overflow-hidden">
      <div className="scan pointer-events-none absolute inset-0 opacity-60" />
      <div className="grain relative mx-auto max-w-7xl px-6 pt-24 pb-28">
        <div className="mono inline-flex items-center gap-2 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          ◆ COACH IA · NOUVELLE GÉNÉRATION
        </div>
        <h1 className="gold-shimmer mt-6 text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
          Ton coach IA.
          <br />
          Chaque matin,
          <br />
          un plan sur mesure.
        </h1>
        <p className="mt-8 max-w-xl text-base text-[#8a8a8a] md:text-lg">
          Check-in de 2 minutes au réveil.
          <br />
          L&apos;IA lit ton énergie, ton sommeil, tes courbatures.
          <br />
          Elle adapte ta séance, ton stack, ton en-cas. Chaque jour.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/onboarding" className="btn-primary">
            Une semaine d&apos;essai <ArrowRight size={14} />
          </Link>
          <Link href="/marketplace" className="btn-ghost">
            Découvrir les programmes
          </Link>
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const items = [
    "CHECK-IN MATINAL",
    "SÉANCE ADAPTÉE",
    "STACK COMPLÉMENTS",
    "EN-CAS DU JOUR",
    "RÉCUP CIBLÉE",
    "APERÇU DEMAIN",
  ];
  const doubled = [...items, ...items, ...items];
  return (
    <div className="hairline-b overflow-hidden">
      <div className="ticker flex gap-12 py-4 whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="mono text-xs tracking-[0.4em] text-[#8a8a8a]">
            ◇ {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Featured({ featured }: { featured: typeof programTemplates }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div>
        <div className="label text-[color:var(--color-accent)]">[ BASE DE DONNÉES IA ]</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
          5 programmes. 1 coach IA.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--color-mute)] md:text-base">
          Les 5 programmations EL COACH METHOD sont la base dans laquelle l&apos;IA pioche
          chaque jour. Elle choisit ta séance, ajuste l&apos;intensité, remplace les mouvements
          si tu as une blessure. Tu ne suis plus un programme générique — tu reçois un plan.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((t) => (
          <FeaturedShowcase key={t.slug} template={t} />
        ))}
      </div>
    </section>
  );
}

/**
 * Carte vitrine — affichage statique, sans lien, sans hover de carte cliquable.
 */
function FeaturedShowcase({ template }: { template: ProgramTemplate }) {
  const sessionsPerWeek =
    template.weeks[0]?.days.filter((d) => d.blocks.length > 0).length ?? 0;
  return (
    <div className="card grain flex h-full flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-white">
          <ProgramIcon template={template} size={36} />
        </div>
        <span className="mono shrink-0 border border-[color:var(--color-gold)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-gold)]">
          Method
        </span>
      </div>
      <div>
        <h3 className="text-xl font-semibold leading-tight tracking-tight">
          {template.name}
        </h3>
        <div className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-mute)]">
          · by El Coach Method
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[color:var(--color-mute)]">
          {template.summary}
        </p>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-4">
        <Stat label="JOURS" value={`${sessionsPerWeek}/sem`} />
        <Stat label="NIVEAU" value={template.level.slice(0, 3).toUpperCase()} />
        <Stat label="SEMAINES" value={`${template.weeks.length}`} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="label">Programmation</div>
          <div className="mono text-sm">EL COACH METHOD</div>
        </div>
        <div className="text-right">
          <div className="mono text-2xl font-semibold">
            {formatPrice(PROGRAM_BASE_PRICE_CENTS)}
          </div>
          <div className="label">/mois</div>
          <div className="mono mt-1 text-[10px] text-[color:var(--color-mute)]">
            +{formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS)} / programme additionnel
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono text-sm">{value}</div>
    </div>
  );
}

const PILLARS: Array<{ slug: string; title: string; body: string }> = [
  {
    slug: "crossfit-pure",
    title: "CROSSFIT PURE",
    body: "WODs programmés, cycles force intégrés. Des performances qui se mesurent.",
  },
  {
    slug: "hybrid-cf-strength",
    title: "HYBRID ENGINE",
    body: "Soulever lourd + courir vite. Force et cardio, sans compromis.",
  },
  {
    slug: "hyrox-pure",
    title: "HYROX PURE",
    body: "Stations maîtrisées, seuils optimisés. Prêt pour le jour J.",
  },
  {
    slug: "volume-block-hypertrophy",
    title: "VOLUME BLOCK HYPERTROPHY",
    body: "Surcharge progressive, fréquence ciblée. RIR maîtrisé, muscle construit.",
  },
  {
    slug: "at-home",
    title: "AT HOME",
    body: "Poids du corps, zéro matériel. Résultats concrets, n'importe où.",
  },
];

function Pillars() {
  return (
    <section className="hairline-t hairline-b bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="label text-[color:var(--color-accent)]">[ LES 5 PROGRAMMES ]</div>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Les bases que l&apos;IA utilise pour toi.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-[#8a8a8a] md:text-base">
          Chaque programme est un référentiel de séances. L&apos;IA pioche dedans
          en fonction de ton état du jour — elle ne te donne jamais une séance
          que tu ne devrais pas faire.
        </p>
        <div className="mt-12 grid gap-px bg-[#1f1f1f] md:grid-cols-3">
          {PILLARS.map(({ slug, title, body }) => {
            const template = programTemplates.find((t) => t.slug === slug);
            return (
              <div key={slug} className="bg-[#0a0a0a] p-8">
                <div className="text-white">
                  {template && <ProgramIcon template={template} size={28} />}
                </div>
                <div className="mono mt-6 text-sm tracking-[0.3em]">{title}</div>
                <p className="mt-3 text-sm text-[#8a8a8a]">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    {
      n: "01",
      t: "Profil & programme",
      b: "Âge, poids, RM, blessures, jeûne, compléments. L'IA apprend qui tu es et choisit le programme adapté.",
    },
    {
      n: "02",
      t: "Check-in matinal · 2 min",
      b: "Énergie, sommeil Apple Watch, jambes, douleurs, mental, libido. L'IA lit ton état réel.",
    },
    {
      n: "03",
      t: "Plan du jour · < 5 sec",
      b: "Score 🟢🟡🔴, séance adaptée, stack compléments, en-cas, protocole récup, alertes, aperçu demain.",
    },
    {
      n: "04",
      t: "Exécute · ajuste demain",
      b: "Tu suis le plan. L'IA apprend de chaque journée et calibre les semaines suivantes.",
    },
  ];
  return (
    <section className="hairline-t bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="label text-[color:var(--color-accent)]">[ LA BOUCLE QUOTIDIENNE ]</div>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Réveil. Check-in. Plan.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-[#8a8a8a] md:text-base">
          Chaque matin, en moins de 5 minutes, ton plan de journée complet.
        </p>
        <div className="mt-12 grid gap-px bg-[#1f1f1f] md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="bg-[#0a0a0a] p-8">
              <div className="mono text-4xl font-semibold">{s.n}</div>
              <div className="mt-6 text-lg font-semibold">{s.t}</div>
              <p className="mt-2 text-sm text-[#8a8a8a]">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 text-center">
      <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">
        L&apos;IA décide.
        <br />
        <span className="text-[#8a8a8a]">Tu exécutes.</span>
      </h2>
      <div className="mt-10 flex justify-center gap-4">
        <Link href="/onboarding" className="btn-primary">
          Une semaine d&apos;essai <ArrowRight size={14} />
        </Link>
        <Link href="/marketplace" className="btn-ghost">
          Découvrir les programmes
        </Link>
      </div>
    </section>
  );
}
