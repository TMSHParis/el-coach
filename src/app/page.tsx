import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <Hero />
      <ThreePillars />
      <Ticker />
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
          ◆ COACHING ADAPTATIF · PAR EL COACH METHOD
        </div>
        <h1 className="gold-shimmer mt-6 text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
          Ton Coaching
          <br />
          Adaptatif personnel.
        </h1>
        <p className="mt-8 max-w-xl text-base text-[#8a8a8a] md:text-lg">
          Un check-in chaque matin.
          <br />
          Un plan sur mesure chaque jour.
          <br />
          Séance adaptée, stack compléments, récupération ciblée — tout généré en moins de
          5 secondes.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CheckinCTA />
          <Link href="#bases-coaching-adaptatif" className="btn-ghost">
            Voir comment ça marche
          </Link>
        </div>
      </div>
    </section>
  );
}

function ThreePillars() {
  const pillars = [
    {
      icon: "⚡",
      title: "Check-in 2 min",
      body: "Énergie, sommeil, corps, mental. Le Coaching Adaptatif lit ton état réel.",
    },
    {
      icon: "🧠",
      title: "Plan généré",
      body: "Séance, stack, en-cas, récupération. Tout adapté à toi, aujourd'hui.",
    },
    {
      icon: "📈",
      title: "Progression mesurée",
      body: "Ton historique, tes alertes, tes tendances. Semaine après semaine.",
    },
  ];
  return (
    <section id="bases-coaching-adaptatif" className="hairline-t hairline-b bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="label text-[color:var(--color-accent)]">[ COMMENT ÇA MARCHE ]</div>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Les bases du Coaching Adaptatif.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-[#8a8a8a] md:text-base">
          5 programmes en base de données. 1 check-in chaque matin. 1 plan généré
          en moins de 5 secondes — séance, stack, récupération, alertes.
        </p>
        <div className="mt-12 grid gap-px bg-[color:var(--color-line)] md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="bg-[#0a0a0a] p-8 md:p-10">
              <div className="text-3xl leading-none">{p.icon}</div>
              <div className="mt-5 text-lg font-semibold tracking-tight">{p.title}</div>
              <p className="mt-2 text-sm text-[color:var(--color-mute)]">{p.body}</p>
            </div>
          ))}
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

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 text-center">
      <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">
        Le Coaching Adaptatif décide.
        <br />
        <span className="text-[#8a8a8a]">Tu exécutes.</span>
      </h2>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <CheckinCTA />
        <Link href="/marketplace" className="btn-ghost">
          Découvrir les programmes
        </Link>
      </div>
    </section>
  );
}

function CheckinCTA() {
  return (
    <Link href="/signup" className="btn-primary flex-col gap-1 py-3">
      <span className="inline-flex items-center gap-2">
        Commencer mon check-in
        <ArrowRight size={14} />
      </span>
      <span className="text-[10px] normal-case tracking-normal opacity-70">
        Free Trial — 7 jours offerts
      </span>
    </Link>
  );
}
