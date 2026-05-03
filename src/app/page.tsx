import Link from "next/link";
import { ArrowRight, Dumbbell, Flame, Timer, Activity, Layers } from "lucide-react";
import { TemplateCard } from "@/components/template-card";
import { programTemplates } from "@/lib/programming";

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
        <h1 className="gold-shimmer mt-6 text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
          Forge yourself.
          <br />
          Anywhere. Always.
        </h1>
        <p className="mt-8 max-w-xl text-base text-[#8a8a8a] md:text-lg">
          Programmes écrits par un coach d&apos;élite.
          <br />
          CrossFit Pure, Hybrid Engine, Hyrox, At Home, Volume Block Hypertrophy.
          <br />
          Suivi quotidien, progression mesurable, aucune fioriture.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/onboarding" className="btn-primary">
            Une semaine d&apos;essai <ArrowRight size={14} />
          </Link>
          <Link href="/marketplace" className="btn-ghost">
            Choisis ton programme
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-[#1f1f1f] pt-8 md:grid-cols-4">
          <HeroStat label="COACHS VÉRIFIÉS" value="40+" />
          <HeroStat label="PROGRAMMES ACTIFS" value="120" />
          <HeroStat label="ATHLÈTES" value="12 400" />
          <HeroStat label="SÉANCES / MOIS" value="84K" />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function Ticker() {
  const items = [
    "CROSSFIT PURE",
    "HYBRID ENGINE",
    "HYROX PURE",
    "VOLUME BLOCK HYPERTROPHY",
    "AT HOME",
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
      <div className="flex items-end justify-between">
        <div>
          <div className="label">[ 01 ] SÉLECTION</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Programmes en vedette
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[color:var(--color-mute)]">
            Les programmations EL COACH · accès complet à 9,90€/mois.
          </p>
        </div>
        <Link href="/marketplace" className="label hidden hover:text-white md:inline-flex">
          Tout voir →
        </Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    {
      icon: Flame,
      title: "CROSSFIT PURE",
      body: "WODs programmés, cycles force intégrés. Des performances qui se mesurent.",
    },
    {
      icon: Activity,
      title: "HYBRID ENGINE",
      body: "Soulever lourd + courir vite. Force et cardio, sans compromis.",
    },
    {
      icon: Timer,
      title: "HYROX PURE",
      body: "Stations maîtrisées, seuils optimisés. Prêt pour le jour J.",
    },
    {
      icon: Dumbbell,
      title: "VOLUME BLOCK HYPERTROPHY",
      body: "Surcharge progressive, fréquence ciblée. RIR maîtrisé, muscle construit.",
    },
    {
      icon: Layers,
      title: "AT HOME",
      body: "Poids du corps, zéro matériel. Résultats concrets, n'importe où.",
    },
  ];
  return (
    <section className="hairline-t hairline-b bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Cinq programmes. Une seule plateforme.
        </h2>
        <div className="mt-12 grid gap-px bg-[#1f1f1f] md:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-[#0a0a0a] p-8">
              <Icon size={20} className="opacity-80" />
              <div className="mono mt-6 text-sm tracking-[0.3em]">{title}</div>
              <p className="mt-3 text-sm text-[#8a8a8a]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    { n: "01", t: "Choisis ton programme", b: "Filtre par discipline, niveau, durée. Transparence totale sur la méthode." },
    { n: "02", t: "Souscris en 30 secondes", b: "Paiement sécurisé Stripe. Annule quand tu veux. Accès immédiat." },
    { n: "03", t: "Entraîne-toi quotidiennement", b: "Séance du jour, sets/reps, RPE. Historique visualisé." },
    { n: "04", t: "Mesure la progression", b: "PR loggés, graphes, benchmarks. Les chiffres ne mentent pas." },
  ];
  return (
    <section className="hairline-t bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Quatre étapes. Zéro excuse.
        </h2>
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
        Le plan arrive.
        <br />
        <span className="text-[#8a8a8a]">L&apos;exécution t&apos;appartient.</span>
      </h2>
      <div className="mt-10 flex justify-center gap-4">
        <Link href="/onboarding" className="btn-primary">
          Une semaine d&apos;essai <ArrowRight size={14} />
        </Link>
        <Link href="/marketplace" className="btn-ghost">
          Choisis ton programme
        </Link>
      </div>
    </section>
  );
}
