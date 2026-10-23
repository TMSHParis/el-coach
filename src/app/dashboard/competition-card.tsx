// Carte « Préparation » du dashboard (partie 3, 4.2 et 4.4) : au-dessus de la semaine,
// visible dès qu'un objectif événement a une date. Composant serveur, sans état.

import { EVENT_ICONS, sportTitle } from "@/lib/competition-params";
import { planSentence, type CompetitionPlan } from "@/lib/competition-plan";
import type { HyroxPrep } from "@/lib/hyrox-prep";
import { PhasePath } from "@/components/phase-path";
import styles from "./dashboard.module.css";

const longDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

export function CompetitionCard({
  plan,
  hyroxPrep,
  categorie,
  niveauVise,
  objectifTemps,
  weekDays,
  loads,
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
}) {
  const isHyrox = plan.event === "Hyrox";
  const raceWeek = plan.current === "evenement";
  const eventNoun = isHyrox || plan.event.includes("athon") || plan.event === "Trail" ? "la course" : "l'événement";
  const title = isHyrox ? (raceWeek ? "SEMAINE DE COURSE" : "PRÉPARATION HYROX") : `PRÉPARATION · ${sportTitle(plan.event).toUpperCase()}`;
  const remaining = raceWeek
    ? plan.daysToEvent === 0
      ? "Jour J"
      : `J−${plan.daysToEvent}`
    : `Dans ${plan.weeksOut} semaine${plan.weeksOut > 1 ? "s" : ""}`;
  const dateLine = [
    isHyrox ? "Hyrox" : sportTitle(plan.event),
    categorie || null,
    longDate(plan.eventDate),
    niveauVise ? `Objectif : ${niveauVise}${objectifTemps ? ` (${objectifTemps})` : ""}` : null,
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
            semaine{plan.weeksOut > 1 ? "s" : ""} avant {eventNoun}
          </span>
        </div>
      )}
      <PhasePath plan={plan} showTitle={false} />
      {current && (
        <div className={styles.upcomingNote} style={{ marginTop: 10 }}>
          {current.label}
          {plan.weekInPhase && plan.currentPhaseWeeks ? ` · semaine ${plan.weekInPhase} sur ${plan.currentPhaseWeeks}` : ""}
          {plan.current === "affutage" ? ` · volume −${Math.round((1 - plan.volumeFactor) * 100)} %` : ""}
        </div>
      )}
      {isHyrox && hyroxPrep ? (
        <HyroxText plan={plan} hyroxPrep={hyroxPrep} />
      ) : (
        <div className={styles.upcomingNote}>
          {current ? `Phase ${current.label}. ` : ""}
          {planSentence(plan)}
        </div>
      )}
      {plan.shortened && <div className={styles.upcomingNote}>Date proche : ton plan est raccourci.</div>}

      {isHyrox && raceWeek && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6, color: "var(--m)" }}>
          <li>Lundi : footing de décrassage, allure facile, 20 à 30 min</li>
          <li>Jeudi : séance d&apos;activation, deux jours avant la course, courte et vive</li>
          <li>Vendredi : repos, sommeil, hydratation, matériel prêt</li>
          <li>
            JOUR J · HYROX{categorie ? `, ${categorie}` : ""}
            {loads ? `, ${loads}` : ", charges de référence affichées"}
          </li>
        </ul>
      )}

      {isHyrox && plan.current === "affutage" && weekDays && weekDays.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className={styles.upcomingNote} style={{ letterSpacing: 2, fontWeight: 700 }}>
            CETTE SEMAINE
          </div>
          {weekDays.map((d) => (
            <div key={d.jour} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0", color: "var(--m)" }}>
              <span>{d.jour}</span>
              <span>{d.titre}</span>
            </div>
          ))}
          <div className={styles.upcomingNote}>Volume de la semaine : {Math.round(plan.volumeFactor * 100)} % du volume normal</div>
        </div>
      )}
    </div>
  );
}

function HyroxText({ plan, hyroxPrep }: { plan: CompetitionPlan; hyroxPrep: HyroxPrep }) {
  const text =
    plan.current === "specifique"
      ? "Plus de simulations et de course compromise. La séance de samedi passe en simulation half."
      : plan.current === "affutage"
        ? "On garde l'intensité et la course compromise, on réduit le volume. Rien de nouveau à ce stade."
        : plan.current === "evenement"
          ? "Semaine de course : rien de lourd, rien de nouveau."
          : "On construit la base : Zone 2, force et technique des stations.";
  void hyroxPrep;
  return <div className={styles.upcomingNote}>{text}</div>;
}
