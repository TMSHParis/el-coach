// Chemin des phases (partie 3, 4.1) : segments proportionnels, repère « aujourd'hui »,
// drapeau de l'événement, durée de chaque phase. Sans état : utilisable côté serveur et client.

import { EVENT_ICONS } from "@/lib/competition-params";
import { pathTitle, phaseLabel, phaseWidthPercent, type CompetitionPlan } from "@/lib/competition-plan";
import { makeT, type Translate } from "@/lib/i18n";
import styles from "./phase-path.module.css";

/** `t` : traducteur de la langue active (français par défaut si non fourni par l'appelant). */
export function PhasePath({ plan, showTitle = true, t = makeT("fr") }: { plan: CompetitionPlan; showTitle?: boolean; t?: Translate }) {
  const flag = plan.event === "Hyrox" ? "🏁" : EVENT_ICONS[plan.event] ?? "🏁";
  return (
    <div className={styles.root}>
      {showTitle && (
        <>
          <div className={styles.title}>{pathTitle(plan.event, t)}</div>
          <div className={styles.sub}>
            {t(plan.planWeeks > 1 ? "dash.path.weeks.many" : "dash.path.weeks.one", { n: plan.planWeeks })}
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
              title={phaseLabel(p.label, t)}
            />
          ))}
          <span className={styles.marker} style={{ left: `${plan.todayFraction * 100}%` }} aria-label={t("dash.path.todayAria")} />
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
            <span className={styles.labelName}>{phaseLabel(p.label, t)}</span>
            {p.key !== "evenement" && <span className={styles.labelDur}>{t("dash.path.wk", { n: p.weeks })}</span>}
            {p.state === "current" && plan.weekInPhase && plan.currentPhaseWeeks && (
              <span className={styles.labelWeek}>
                {t("dash.path.weekOf", { week: plan.weekInPhase, weeks: plan.currentPhaseWeeks })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
