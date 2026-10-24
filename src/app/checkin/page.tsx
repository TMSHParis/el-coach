import Link from "next/link";
import { isCheckinDoneToday } from "./actions";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayDayNumber } from "@/lib/demo-session";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { buildCheckinPlan } from "@/lib/checkin-plan";
import { nextSessionByProgram } from "@/lib/program-position";
import { splitIconLabel, standardCycleFor } from "@/lib/standard-week";
import { WEEK_DAYS, isEmptyCycle } from "@/lib/week-cycle";
import type { WeekCycle } from "@/app/signup/actions";
import { resolveDayState } from "@/lib/ecm-engine";
import { stripLeadingEmoji } from "@/lib/advice-session";
import { todayKey } from "@/lib/date-key";
import { effectiveWeekCycle } from "@/lib/week-overrides";
import { getT } from "@/lib/i18n/server";
import { formatDate, type Lang, type Translate } from "@/lib/i18n";
import { sportLabel } from "@/lib/sports-catalog";
import { tc } from "@/lib/i18n/content";
import { CheckinForm } from "./checkin-form";
import { checkinFontVariables } from "./checkin-fonts";
import styles from "./checkin.module.css";

const DAY_STATE_KEY = {
  vert: "ci.state.vert",
  jaune: "ci.state.jaune",
  rouge: "ci.state.rouge",
  repos: "ci.state.repos",
} as const;

/** "Hier" si c'est vraiment la veille, sinon la date — le dernier check-in
 * n'est pas forcément d'hier (jour sauté). */
function relativeDayLabel(date: string, t: Translate, lang: Lang): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === yesterday.toISOString().slice(0, 10)) return t("ci.yesterday");
  const [y, m, d] = date.split("-").map(Number);
  return formatDate(lang, new Date(y, m - 1, d), { day: "numeric", month: "short" });
}

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("ci.meta.title") };
}

export default async function CheckinPage() {
  const { t, lang } = await getT();
  const doneToday = await isCheckinDoneToday();
  const userId = await getUserId();
  const profile = userId
    ? await prisma.profile.findUnique({ where: { userId }, select: { programme: true, weekCycle: true } })
    : null;
  // "Tes habitudes" — 3 séances les plus fréquentes des 30 derniers jours.
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceKey = since.toISOString().slice(0, 10);
  const habitRows = userId
    ? await prisma.checkin.groupBy({
        by: ["seance"],
        where: { userId, date: { gte: sinceKey }, seance: { not: null } },
        _count: { seance: true },
        orderBy: { _count: { seance: "desc" } },
        take: 3,
      })
    : [];
  const habits = habitRows.map((r) => r.seance).filter((s): s is string => Boolean(s));

  // "Prévu aujourd'hui" (partie 3, mission 9) — uniquement la semaine enregistrée dans le profil, lue
  // pour la date du jour : modification ponctuelle, puis alternance A/B, puis semaine type.
  const stored = ((userId ? await effectiveWeekCycle(userId, profile?.weekCycle, todayKey()) : profile?.weekCycle) as unknown as WeekCycle | null) ?? null;
  // Semaine jamais personnalisée : la semaine standard du programme principal, celle que le profil affiche.
  const weekCycle = isEmptyCycle(stored) && profile?.programme ? standardCycleFor(profile.programme) : stored;
  const nextByProgram = await nextSessionByProgram({ userId, weekCycle });
  const plan = buildCheckinPlan(weekCycle, WEEK_DAYS[todayDayNumber() - 1], nextByProgram, lang);

  // Les 5 programmes ECM sont toujours proposés (At Home compris), le programme prévu en tête.
  const plannedValue = plan.kind === "day" ? plan.cards.find((c) => c.ecm)?.value : undefined;
  const programs = Object.keys(SPORT_LABEL_TO_SLUG)
    .map((value) => {
      const { icon, label } = splitIconLabel(value);
      return { value, icon, name: label, next: tc(lang, nextByProgram[value] ?? ""), planned: value === plannedValue };
    })
    .sort((x, y) => Number(y.planned) - Number(x.planned));

  // Rappel du dernier check-in réalisé (pas forcément hier si un jour a été sauté).
  const lastCheckin =
    userId != null
      ? await prisma.checkin.findFirst({ where: { userId, date: { lt: todayKey() } }, orderBy: { date: "desc" } })
      : null;
  const lastOutput =
    userId != null && lastCheckin
      ? await prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: lastCheckin.date } } })
      : null;
  const lastEcmState = (lastOutput?.output as { ecm?: { state?: "green" | "yellow" | "red" } } | null)?.ecm?.state;
  const prevCheckin = lastCheckin
    ? {
        dayLabel: relativeDayLabel(lastCheckin.date, t, lang),
        stateLabel: t(DAY_STATE_KEY[resolveDayState(lastEcmState, lastCheckin)]),
        seance: lastCheckin.seance ? stripLeadingEmoji(sportLabel(lastCheckin.seance, lang)) : null,
        energie: lastCheckin.energie,
      }
    : null;

  if (doneToday) {
    return (
      <div className={checkinFontVariables}>
        <div className={styles.checkinRoot}>
          <div className={styles.hero}>
            <div className={styles.logo}>⚡</div>
            <div className={styles.bn}>EL COACH METHOD</div>
            <div className={styles.bt}>Daily Performance Check-In</div>
          </div>
          <div className={styles.doneBanner}>
            <div className={styles.doneIcon}>✅</div>
            <div className={styles.doneTitle}>{t("ci.done.title")}</div>
            <div className={styles.doneSub}>
              {t("ci.done.sub1")}
              <br />
              {t("ci.done.sub2")}
            </div>
            <Link href="/dashboard" className={styles.doneBtn}>
              {t("ci.done.btn")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={checkinFontVariables}>
      <CheckinForm habits={habits} plan={plan} programs={programs} prevCheckin={prevCheckin} />
    </div>
  );
}
