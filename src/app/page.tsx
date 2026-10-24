import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/clerk";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { isCheckinDoneToday } from "@/app/checkin/actions";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n";

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
  const { t } = await getT();
  return (
    <div className={ecmFontVariables}>
      <Hero state={state} t={t} />
      <ThreePillars t={t} />
      <Ticker t={t} />
      <CTA state={state} t={t} />
    </div>
  );
}

function Hero({ state, t }: { state: HomeState; t: Translate }) {
  return (
    <section className="hairline-b relative overflow-hidden">
      <div className="scan pointer-events-none absolute inset-0 opacity-60" />
      <div className="grain relative mx-auto max-w-7xl px-6 pt-8 pb-16">
        <div className="mono inline-flex items-center gap-2 border border-[color:var(--color-line)] bg-[color:var(--color-ash)] px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          {t("app.home.badge")}
        </div>
        <h1
          className="gold-shimmer mt-3 text-5xl leading-[0.95] tracking-tight md:text-7xl lg:text-8xl"
          style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
        >
          {t("app.home.title1")}
          <br />
          {t("app.home.title2")}
        </h1>
        <p className="mt-4 max-w-xl text-base text-[color:var(--c-8a8a8a)] md:text-lg">
          {t("app.home.sub1")}
          <br />
          {t("app.home.sub2")}
          <br />
          {t("app.home.sub3")}
        </p>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5">
          <HomeCTAButtons state={state} t={t} />
        </div>
      </div>
    </section>
  );
}

function ThreePillars({ t }: { t: Translate }) {
  const pillars = [
    {
      icon: "⚡",
      title: t("app.home.pillar1.title"),
      body: t("app.home.pillar1.body"),
    },
    {
      icon: "🧠",
      title: t("app.home.pillar2.title"),
      body: t("app.home.pillar2.body"),
    },
    {
      icon: "📈",
      title: t("app.home.pillar3.title"),
      body: t("app.home.pillar3.body"),
    },
  ];
  return (
    <section id="bases-coaching-adaptatif" className="hairline-t hairline-b bg-[var(--c-0a0a0a)]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="label text-[color:var(--color-accent)]">{t("app.home.how")}</div>
        <h2
          className="mt-3 max-w-3xl text-3xl tracking-tight md:text-5xl"
          style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
        >
          {t("app.home.howTitle")}
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--c-8a8a8a)] md:text-base">
          {t("app.home.howBody")}
        </p>
        <div className="mt-10 grid gap-px bg-[color:var(--color-line)] md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="bg-[var(--c-0a0a0a)] p-8 md:p-10">
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

function Ticker({ t: tr }: { t: Translate }) {
  const items = [
    tr("app.home.ticker1"),
    tr("app.home.ticker2"),
    tr("app.home.ticker3"),
    tr("app.home.ticker4"),
    tr("app.home.ticker5"),
    tr("app.home.ticker6"),
  ];
  const doubled = [...items, ...items, ...items];
  return (
    <div className="hairline-b overflow-hidden">
      <div className="ticker flex gap-12 py-4 whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="mono text-xs tracking-[0.4em] text-[color:var(--c-8a8a8a)]">
            ◇ {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function CTA({ state, t }: { state: HomeState; t: Translate }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 text-center">
      <h2
        className="text-4xl tracking-tight md:text-6xl"
        style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
      >
        {t("app.home.cta1")}
        <br />
        <span className="text-[color:var(--c-8a8a8a)]">{t("app.home.cta2")}</span>
      </h2>
      <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2.5">
        <PrimaryButton state={state} t={t} />
      </div>
    </section>
  );
}

function PrimaryButton({ state, t }: { state: HomeState; t: Translate }) {
  if (state === "anon") {
    return (
      <Link href="/signup" className="btn-home-primary" style={{ flexDirection: "column", gap: 2, padding: "16px 24px" }}>
        <span>{t("app.home.signup")}</span>
        <span
          style={{
            fontFamily: "var(--font-barlow-condensed, sans-serif)",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "none",
            color: "var(--on-accent)",
          }}
        >
          {t("app.home.trial")}
        </span>
      </Link>
    );
  }
  return state === "done" ? (
    <Link href="/dashboard" className="btn-home-primary">
      {t("app.home.dashboard")}
    </Link>
  ) : (
    <Link href="/checkin" className="btn-home-primary">
      {t("app.home.checkin")}
    </Link>
  );
}

function HomeCTAButtons({ state, t }: { state: HomeState; t: Translate }) {
  return (
    <>
      <PrimaryButton state={state} t={t} />
      {state === "anon" ? (
        <Link href="/signin" className="btn-home-secondary">
          {t("app.home.signin")}
        </Link>
      ) : (
        <Link href="/profile/edit" className="btn-home-secondary">
          {t("app.home.editProfile")}
        </Link>
      )}
      <Link href="#bases-coaching-adaptatif" className="btn-home-secondary">
        {t("app.home.seeHow")}
      </Link>
    </>
  );
}
