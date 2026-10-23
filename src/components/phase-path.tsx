// Chemin des phases (partie 3, 4.1) : segments proportionnels, repère « aujourd'hui »,
// drapeau de l'événement, durée de chaque phase. Sans état : utilisable côté serveur et client.

import { EVENT_ICONS } from "@/lib/competition-params";
import { pathTitle, phaseWidthPercent, type CompetitionPlan } from "@/lib/competition-plan";
import styles from "./phase-path.module.css";

export function PhasePath({ plan, showTitle = true }: { plan: CompetitionPlan; showTitle?: boolean }) {
  const flag = plan.event === "Hyrox" ? "🏁" : EVENT_ICONS[plan.event] ?? "🏁";
  return (
    <div className={styles.root}>
      {showTitle && (
        <>
          <div className={styles.title}>{pathTitle(plan.event)}</div>
          <div className={styles.sub}>
            {plan.planWeeks} semaine{plan.planWeeks > 1 ? "s" : ""}
          </div>
        </>
      )}
      <div className={styles.barWrap}>
        <div className={styles.bar}>
          {plan.phases.map((p) => (
            <div
              key={p.key}
              className={`${styles.seg} ${styles[p.state]}`}
              style={{ width: `${phaseWidthPercent(plan, p)}%` }}
              title={p.label}
            />
          ))}
          <span className={styles.marker} style={{ left: `${plan.todayFraction * 100}%` }} aria-label="Aujourd'hui" />
        </div>
        <span className={styles.flag} aria-hidden="true">
          {flag}
        </span>
      </div>
      <div className={styles.labels}>
        {plan.phases.map((p) => (
          <div
            key={p.key}
            className={`${styles.label} ${p.state === "current" ? styles.labelOn : ""}`}
            style={{ width: `${phaseWidthPercent(plan, p)}%` }}
          >
            <span className={styles.labelName}>{p.label}</span>
            {p.key !== "evenement" && <span className={styles.labelDur}>{p.weeks} sem.</span>}
            {p.state === "current" && plan.weekInPhase && plan.currentPhaseWeeks && (
              <span className={styles.labelWeek}>
                semaine {plan.weekInPhase} sur {plan.currentPhaseWeeks}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
