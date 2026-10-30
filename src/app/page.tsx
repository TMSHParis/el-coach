import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/clerk";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { isCheckinDoneToday } from "@/app/checkin/actions";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import home from "./home-sections.module.css";
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
      <div style={{ height: 100 }} aria-hidden />
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

const ICON_PROPS = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function ThreePillars({ t }: { t: Translate }) {
  return (
    <section id="bases-coaching-adaptatif" className={home.section}>
      <div className={home.kicker}>{t("app.home.how")}</div>
      <h2 className={home.title}>{t("app.home.howTitle")}</h2>
      <p className={home.intro}>{t("app.home.howBody")}</p>
      <div className={home.cards}>
        <article className={home.card}>
          <div className={home.cardHead}>
            <span className={home.icon}>
              <svg {...ICON_PROPS}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>
            </span>
            <h3 className={home.cardTitle}>{t("app.home.pillar1.title")}</h3>
          </div>
          <p className={home.cardBody}>{t("app.home.pillar1.body")}</p>
          <div className={home.preview} aria-hidden>
            {([["energy", 70], ["sleep", 55], ["body", 80], ["mind", 65]] as const).map(([k, w]) => (
              <div key={k} className={home.bar}>
                <span className={home.barLabel}>{t(`app.home.pv.${k}`)}</span>
                <span className={home.barTrack}><span className={home.barFill} style={{ width: `${w}%` }} /></span>
              </div>
            ))}
          </div>
        </article>

        <article className={home.card}>
          <div className={home.cardHead}>
            <span className={home.icon}>
              <svg {...ICON_PROPS}><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 12 10 5 10-5" /><path d="m2 17 10 5 10-5" /></svg>
            </span>
            <h3 className={home.cardTitle}>{t("app.home.pillar2.title")}</h3>
          </div>
          <p className={home.cardBody}>{t("app.home.pillar2.body")}</p>
          <div className={`${home.preview} ${home.pills}`} aria-hidden>
            {(["session", "stack", "snack", "recovery"] as const).map((k) => (
              <span key={k} className={home.pill}>{t(`app.home.pv.${k}`)}</span>
            ))}
          </div>
        </article>

        <article className={home.card}>
          <div className={home.cardHead}>
            <span className={home.icon}>
              <svg {...ICON_PROPS}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></svg>
            </span>
            <h3 className={home.cardTitle}>{t("app.home.pillar3.title")}</h3>
          </div>
          <p className={home.cardBody}>{t("app.home.pillar3.body")}</p>
          <div className={home.preview} aria-hidden>
            <svg className={home.curve} viewBox="0 0 200 64" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 56 C 30 52, 44 40, 70 42 S 110 28, 134 24 S 170 10, 196 8" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className={home.words}>
              <span>{t("app.home.pv.history")}</span>
              <span>{t("app.home.pv.alerts")}</span>
              <span>{t("app.home.pv.trends")}</span>
            </div>
          </div>
        </article>
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
  // Deux moitiés identiques (chacune = la liste répétée 2 fois) : le défilement de -50 % boucle sans saut ni vide.
  const half = (key: string) => (
    <div className={home.half} key={key} aria-hidden={key === "b" ? true : undefined}>
      {[...items, ...items].map((label, i) => (
        <span key={i} className={`${home.item} ${i >= items.length ? home.dup : ""}`}>
          <span className={home.diamond} />
          {label}
        </span>
      ))}
    </div>
  );
  return (
    <div className={home.ticker}>
      <div className={home.track}>
        {half("a")}
        {half("b")}
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
