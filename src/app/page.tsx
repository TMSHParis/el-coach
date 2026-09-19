import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/clerk";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { isCheckinDoneToday } from "@/app/checkin/actions";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";

/** "anon" = déconnecté · "todo" = connecté, check-in pas fait · "done" = check-in du jour fait. */
type HomeState = "anon" | "todo" | "done";

async function resolveHomeState(): Promise<HomeState> {
  if (!clerkEnabled) return "anon";
  const { userId } = await auth();
  if (!userId) return "anon";
  // Base de données d'abord (fiable sur tous les appareils), cookie du jour en repli.
  const checkin = await prisma.checkin
    .findUnique({ where: { userId_date: { userId, date: todayKey() } }, select: { id: true } })
    .catch(() => null);
  if (checkin || (await isCheckinDoneToday())) return "done";
  return "todo";
}

export default async function Home() {
  const state = await resolveHomeState();
  return (
    <div className={ecmFontVariables}>
      <Hero state={state} />
      <ThreePillars />
      <Ticker />
      <CTA state={state} />
    </div>
  );
}

function Hero({ state }: { state: HomeState }) {
  return (
    <section className="hairline-b relative overflow-hidden">
      <div className="scan pointer-events-none absolute inset-0 opacity-60" />
      <div className="grain relative mx-auto max-w-7xl px-6 pt-8 pb-16">
        <div className="mono inline-flex items-center gap-2 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          ◆ COACHING ADAPTATIF · PAR EL COACH METHOD
        </div>
        <h1
          className="gold-shimmer mt-3 text-5xl leading-[0.95] tracking-tight md:text-7xl lg:text-8xl"
          style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
        >
          Ton Coaching
          <br />
          Adaptatif personnel.
        </h1>
        <p className="mt-4 max-w-xl text-base text-[#8a8a8a] md:text-lg">
          Un check-in chaque matin.
          <br />
          Un plan sur mesure chaque jour.
          <br />
          Séance adaptée, stack compléments, récupération ciblée — tout généré en moins de
          5 secondes.
        </p>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5">
          <HomeCTAButtons state={state} />
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
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="label text-[color:var(--color-accent)]">[ COMMENT ÇA MARCHE ]</div>
        <h2
          className="mt-3 max-w-3xl text-3xl tracking-tight md:text-5xl"
          style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
        >
          Les bases du Coaching Adaptatif.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-[#8a8a8a] md:text-base">
          5 programmes en base de données. 1 check-in chaque matin. 1 plan généré
          en moins de 5 secondes — séance, stack, récupération, alertes.
        </p>
        <div className="mt-10 grid gap-px bg-[color:var(--color-line)] md:grid-cols-3">
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

function CTA({ state }: { state: HomeState }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 text-center">
      <h2
        className="text-4xl tracking-tight md:text-6xl"
        style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
      >
        Le Coaching Adaptatif décide.
        <br />
        <span className="text-[#8a8a8a]">Tu exécutes.</span>
      </h2>
      <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2.5">
        <PrimaryButton state={state} />
      </div>
    </section>
  );
}

function PrimaryButton({ state }: { state: HomeState }) {
  if (state === "anon") {
    return (
      <Link href="/signup" className="btn-home-primary" style={{ flexDirection: "column", gap: 2, padding: "16px 24px" }}>
        <span>Je m&apos;inscris</span>
        <span
          style={{
            fontFamily: "var(--font-barlow-condensed, sans-serif)",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "none",
            color: "#000",
          }}
        >
          Free Trial — 7 jours offerts
        </span>
      </Link>
    );
  }
  return state === "done" ? (
    <Link href="/dashboard" className="btn-home-primary">
      Mon dashboard
    </Link>
  ) : (
    <Link href="/checkin" className="btn-home-primary">
      Mon check-in du jour
    </Link>
  );
}

function HomeCTAButtons({ state }: { state: HomeState }) {
  return (
    <>
      <PrimaryButton state={state} />
      {state === "anon" ? (
        <Link href="/signin" className="btn-home-secondary">
          Déjà inscrit · Je me connecte
        </Link>
      ) : (
        <Link href="/profile/edit" className="btn-home-secondary">
          Je mets à jour mon profil
        </Link>
      )}
      <Link href="#bases-coaching-adaptatif" className="btn-home-secondary">
        Voir comment ça marche
      </Link>
    </>
  );
}
