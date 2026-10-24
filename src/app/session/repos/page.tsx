import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { recoveryBlocks, type StoredAdvice } from "@/lib/advice-session";
import { sessionFontVariables } from "../session-fonts";
import { RecoveryBlocks } from "../recovery-blocks";
import styles from "./repos.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("sp.repos.title") };
}

/** Page « Repos » (partie 4, mission 4), ouverte par « VOIR LA RÉCUPÉRATION » d'un jour de repos sans activité. */
export default async function ReposPage() {
  const { t, lang } = await getT();
  const userId = await getUserId();
  const output = userId
    ? await prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: todayKey() } } })
    : null;
  const blocks = recoveryBlocks((output?.output as { advice?: StoredAdvice } | null)?.advice, t);
  const dl = formatDate(lang, new Date(), { weekday: "short", day: "numeric", month: "long" });

  return (
    <div className={sessionFontVariables}>
      <div className={styles.root}>
        <div className={styles.top}>
          <Link href="/" className={styles.back}>
            {t("sp.back")}
          </Link>
          <span className={styles.topDate}>{dl.charAt(0).toUpperCase() + dl.slice(1)}</span>
        </div>

        <div className={styles.header}>
          <div className={styles.status}>
            <span className={styles.dot} />
            {t("sp.repos.status")}
          </div>
          <div className={styles.headMain}>
            <div className={styles.big}>{t("sp.repos.big")}</div>
            <div className={styles.headRight}>
              <div className={styles.headName}>{t("sp.repos.name")}</div>
              <div className={styles.headSub}>{t("sp.repos.sub")}</div>
            </div>
          </div>
          <div className={styles.sep} />
          <p className={styles.text}>{t("sp.repos.text")}</p>
        </div>

        <div className={styles.sectionTitle}>
          <span>{t("sp.yourRecovery")}</span>
        </div>
        <p className={styles.help}>{t("sp.moveHelp")}</p>
        <RecoveryBlocks blocks={blocks} />

        <div data-bottom-bar className={styles.ctaBar}>
          <Link href="/dashboard" className={styles.cta}>
            {t("sp.dashCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
