// Carte « Préparation » du dashboard (partie 3, 4.2 et 4.4) : au-dessus de la semaine,
// visible dès qu'un objectif événement a une date. Composant serveur, sans état.

import { EVENT_ICONS, sportTitle } from "@/lib/competition-params";
import { planSentence, phaseLabel, type CompetitionPlan } from "@/lib/competition-plan";
import { formatDate, makeT, type DictKey, type Lang, type Translate } from "@/lib/i18n";
import type { HyroxPrep } from "@/lib/hyrox-prep";
import { PhasePath } from "@/components/phase-path";
import styles from "./dashboard.module.css";

const longDate = (lang: Lang, key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return formatDate(lang, new Date(y, m - 1, d), { day: "numeric", month: "long", year: "numeric" });
};

/** Niveaux visés stockés en français : affichage seulement. */
const LEVEL_KEYS: Record<string, DictKey> = {
  Finir: "dash.level.Finir",
  Performer: "dash.level.Performer",
  Podium: "dash.level.Podium",
  Loisir: "dash.level.Loisir",
  Amateur: "dash.level.Amateur",
  "Élite": "dash.level.Elite",
};

export function CompetitionCard({
  plan,
  hyroxPrep,
  categorie,
  niveauVise,
  objectifTemps,
  weekDays,
  loads,
  lang = "fr",
}: {
  plan: CompetitionPlan;
  hyroxPrep: HyroxPrep | null;
  categorie: string | null;
  niveauVise: string | null;
  objectifTemps?: string | null;
  /** Semaine du programme en 7 jours (affûtage Hyrox) : jour + intitulé. */
  weekDays?: { jour: string; titre: string }[];
  /** Charges de référence du jour J (Hyrox). */
  loads?: string;
  lang?: Lang;
}) {
  const t = makeT(lang);
  const isHyrox = plan.event === "Hyrox";
  const raceWeek = plan.current === "evenement";
  const isRace = isHyrox || plan.event.includes("athon") || plan.event === "Trail";
  const beforeKey = `dash.comp.${isRace ? "beforeRace" : "beforeEvent"}.${plan.weeksOut > 1 ? "many" : "one"}` as DictKey;
  const title = isHyrox
    ? raceWeek
      ? t("dash.comp.raceWeek")
      : t("dash.comp.prepHyrox")
    : t("dash.comp.prep", { sport: sportTitle(plan.event, t).toUpperCase() });
  const remaining = raceWeek
    ? plan.daysToEvent === 0
      ? t("dash.comp.dayJ")
      : t("dash.comp.jMinus", { n: plan.daysToEvent })
    : t(plan.weeksOut > 1 ? "dash.comp.in.many" : "dash.comp.in.one", { n: plan.weeksOut });
  const dateLine = [
    isHyrox ? "Hyrox" : sportTitle(plan.event, t),
    categorie || null,
    longDate(lang, plan.eventDate),
    niveauVise ? `${t("dash.comp.goal", { level: LEVEL_KEYS[niveauVise] ? t(LEVEL_KEYS[niveauVise]) : niveauVise })}${objectifTemps ? ` (${objectifTemps})` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const current = plan.phases.find((p) => p.state === "current");

  return (
    <div className={styles.upcomingCard}>
      <div className={styles.upcomingHead}>
        <div className={styles.l}>
          <span>{EVENT_ICONS[plan.event] ?? "🎯"}</span>
          <span className={styles.txt}>{title}</span>
        </div>
        <span className={styles.name}>{remaining}</span>
      </div>
      <div className={styles.upcomingSub}>
        <span className={styles.name}>{dateLine}</span>
      </div>
      {!isHyrox && (
        <div style={{ margin: "10px 0 2px" }}>
          <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{plan.weeksOut}</span>{" "}
          <span style={{ fontSize: 12, color: "var(--m)" }}>
            {t(beforeKey)}
          </span>
        </div>
      )}
      <PhasePath plan={plan} showTitle={false} t={t} />
      {current && (
        <div className={styles.upcomingNote} style={{ marginTop: 10 }}>
          {phaseLabel(current.label, t)}
          {plan.weekInPhase && plan.currentPhaseWeeks ? t("dash.comp.weekOf", { week: plan.weekInPhase, weeks: plan.currentPhaseWeeks }) : ""}
          {plan.current === "affutage" ? t("dash.comp.volume", { n: Math.round((1 - plan.volumeFactor) * 100) }) : ""}
        </div>
      )}
      {isHyrox && hyroxPrep ? (
        <HyroxText plan={plan} hyroxPrep={hyroxPrep} t={t} />
      ) : (
        <div className={styles.upcomingNote}>
          {current ? t("dash.comp.phase", { label: phaseLabel(current.label, t) }) : ""}
          {planSentence(plan, t)}
        </div>
      )}
      {plan.shortened && <div className={styles.upcomingNote}>{t("dash.comp.shortened")}</div>}

      {isHyrox && raceWeek && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6, color: "var(--m)" }}>
          <li>{t("dash.comp.rw.mon")}</li>
          <li>{t("dash.comp.rw.thu")}</li>
          <li>{t("dash.comp.rw.fri")}</li>
          <li>
            {t("dash.comp.rw.raceDay")}
            {categorie ? `, ${categorie}` : ""}
            {loads ? `, ${loads}` : t("dash.comp.rw.refLoads")}
          </li>
        </ul>
      )}

      {isHyrox && plan.current === "affutage" && weekDays && weekDays.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className={styles.upcomingNote} style={{ letterSpacing: 2, fontWeight: 700 }}>
            {t("dash.comp.thisWeek")}
          </div>
          {weekDays.map((d) => (
            <div key={d.jour} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0", color: "var(--m)" }}>
              <span>{d.jour}</span>
              <span>{d.titre}</span>
            </div>
          ))}
          <div className={styles.upcomingNote}>{t("dash.comp.weekVolume", { n: Math.round(plan.volumeFactor * 100) })}</div>
        </div>
      )}
    </div>
  );
}

function HyroxText({ plan, hyroxPrep, t }: { plan: CompetitionPlan; hyroxPrep: HyroxPrep; t: Translate }) {
  const text =
    plan.current === "specifique"
      ? t("dash.comp.hyrox.specifique")
      : plan.current === "affutage"
        ? t("dash.comp.hyrox.affutage")
        : plan.current === "evenement"
          ? t("dash.comp.hyrox.evenement")
          : t("dash.comp.hyrox.base");
  void hyroxPrep;
  return <div className={styles.upcomingNote}>{text}</div>;
}
