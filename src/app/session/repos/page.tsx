import Link from "next/link";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { recoveryBlocks, type StoredAdvice } from "@/lib/advice-session";
import { sessionFontVariables } from "../session-fonts";
import { RecoveryBlocks } from "../recovery-blocks";
import styles from "./repos.module.css";

export const metadata = { title: "Repos — EL COACH METHOD" };

/** Page « Repos » (partie 4, mission 4), ouverte par « VOIR LA RÉCUPÉRATION » d'un jour de repos sans activité. */
export default async function ReposPage() {
  const userId = await getUserId();
  const output = userId
    ? await prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: todayKey() } } })
    : null;
  const blocks = recoveryBlocks((output?.output as { advice?: StoredAdvice } | null)?.advice);
  const dl = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });

  return (
    <div className={sessionFontVariables}>
      <div className={styles.root}>
        <div className={styles.top}>
          <Link href="/" className={styles.back}>
            ← Accueil
          </Link>
          <span className={styles.topDate}>{dl.charAt(0).toUpperCase() + dl.slice(1)}</span>
        </div>

        <div className={styles.header}>
          <div className={styles.status}>
            <span className={styles.dot} />
            Repos prévu aujourd&apos;hui
          </div>
          <div className={styles.headMain}>
            <div className={styles.big}>REPOS</div>
            <div className={styles.headRight}>
              <div className={styles.headName}>🛏️ Jour de repos</div>
              <div className={styles.headSub}>Ta semaine prévoit du repos</div>
            </div>
          </div>
          <div className={styles.sep} />
          <p className={styles.text}>
            Le sommeil et l&apos;hydratation font partie de la progression. Si tu veux bouger, une marche ou de la mobilité suffit.
          </p>
        </div>

        <div className={styles.sectionTitle}>
          <span>Ta récupération</span>
        </div>
        <p className={styles.help}>Consulte les mouvements quand tu veux. Les ▶️ ouvrent les vidéos.</p>
        <RecoveryBlocks blocks={blocks} />

        <div className={styles.ctaBar}>
          <Link href="/dashboard" className={styles.cta}>
            VOIR MON DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  );
}
