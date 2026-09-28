import Link from "next/link";
import { isCheckinDoneToday } from "./actions";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { SLUG_TO_SPORT_LABEL } from "@/lib/ecm-programs";
import { CheckinForm } from "./checkin-form";
import { checkinFontVariables } from "./checkin-fonts";
import styles from "./checkin.module.css";

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
      <CheckinForm programmes={programmes} habits={habits} todayEcm={todayEcm} />
    </div>
  );
}
