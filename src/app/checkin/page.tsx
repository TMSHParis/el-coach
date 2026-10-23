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
import { CheckinForm } from "./checkin-form";
import { checkinFontVariables } from "./checkin-fonts";
import styles from "./checkin.module.css";

const DAY_STATE_LABEL: Record<"vert" | "jaune" | "rouge" | "repos", string> = {
  vert: "🟢 État vert",
  jaune: "🟡 État jaune",
  rouge: "🔴 État rouge",
  repos: "🛋️ Repos",
};

/** "Hier" si c'est vraiment la veille, sinon la date — le dernier check-in
 * n'est pas forcément d'hier (jour sauté). */
function relativeDayLabel(date: string): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === yesterday.toISOString().slice(0, 10)) return "Hier";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export const metadata = { title: "Check-in du jour — EL COACH METHOD" };

export default async function CheckinPage() {
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
  const plan = buildCheckinPlan(weekCycle, WEEK_DAYS[todayDayNumber() - 1], nextByProgram);

  // Les 5 programmes ECM sont toujours proposés (At Home compris), le programme prévu en tête.
  const plannedValue = plan.kind === "day" ? plan.cards.find((c) => c.ecm)?.value : undefined;
  const programs = Object.keys(SPORT_LABEL_TO_SLUG)
    .map((value) => {
      const { icon, label } = splitIconLabel(value);
      return { value, icon, name: label, next: nextByProgram[value] ?? "", planned: value === plannedValue };
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
        dayLabel: relativeDayLabel(lastCheckin.date),
        stateLabel: DAY_STATE_LABEL[resolveDayState(lastEcmState, lastCheckin)],
        seance: lastCheckin.seance ? stripLeadingEmoji(lastCheckin.seance) : null,
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
            <div className={styles.doneTitle}>Check-in déjà validé</div>
            <div className={styles.doneSub}>
              Tu as déjà complété ton check-in aujourd&apos;hui.
              <br />
              Ton dashboard est à jour.
            </div>
            <Link href="/dashboard" className={styles.doneBtn}>
              Voir mon dashboard →
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
