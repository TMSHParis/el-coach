import Link from "next/link";
import { isCheckinDoneToday } from "./actions";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { SLUG_TO_SPORT_LABEL } from "@/lib/ecm-programs";
import { resolveDayState } from "@/lib/ecm-engine";
import { stripLeadingEmoji } from "@/lib/advice-session";
import { todayKey } from "@/lib/date-key";
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
  const [profile, demo] = await Promise.all([
    userId
      ? prisma.profile.findUnique({ where: { userId }, select: { programme: true, programmes: true } })
      : null,
    getDemoState(),
  ]);
  // Programmes actifs choisis dans /settings — proposés en tête du choix de séance.
  const programmes = profile
    ? profile.programmes.length > 0
      ? profile.programmes
      : [profile.programme].filter(Boolean)
    : [];

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

  // "Prévu aujourd'hui" — séance ECM programmée si un programme actif en a une pour le jour.
  const todayEcmSession = demo.programSlug ? resolveTodaySession(demo.programSlug, demo.fatigueScore) : null;
  const todayEcmLabel = demo.programSlug ? SLUG_TO_SPORT_LABEL[demo.programSlug] : undefined;
  const todayEcm =
    todayEcmSession && !todayEcmSession.needsFatigueInput && todayEcmSession.day.blocks.length > 0 && todayEcmLabel
      ? { value: todayEcmLabel, label: todayEcmLabel, sub: todayEcmSession.day.focus }
      : null;

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
      <CheckinForm programmes={programmes} habits={habits} todayEcm={todayEcm} prevCheckin={prevCheckin} />
    </div>
  );
}
