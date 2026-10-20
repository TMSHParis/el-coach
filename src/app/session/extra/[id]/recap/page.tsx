import { redirect } from "next/navigation";
import { getExtraActivity, updateExtraActivityRecap } from "../../../extra-activity-actions";
import { sessionFontVariables } from "../../../session-fonts";
import { RecapView } from "../../../recap/recap-view";

export const metadata = { title: "Compte rendu — EL COACH METHOD" };

/** Compte rendu d'une 2e (ou 3e...) activité du jour — même page que /session/recap
 * mais source ExtraActivity. Pas de comparaisons historique/mouvement par mouvement :
 * ces activités n'ont pas le suivi détaillé des séances ECM. */
export default async function ExtraActivityRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getExtraActivity(id);
  if (!activity || !activity.completed) redirect("/dashboard");

  return (
    <div className={sessionFontVariables}>
      <RecapView
        date={activity.date}
        sport={activity.seance}
        durationSec={activity.durationSec ?? 0}
        completionRate={activity.completionRate ?? 0}
        feeling={activity.sessionFeeling}
        note={activity.sessionNote}
        blocs={[]}
        missing={[]}
        comparisons={[]}
        coachText={activity.coachMessage}
        watch={activity.caloriesBrulees !== null ? { kcalActive: null, kcalTotal: null, effort: null, bpm: null, kcalUnknown: activity.caloriesBrulees } : null}
        watchText={null}
        gauge={null}
        onUpdate={updateExtraActivityRecap.bind(null, id)}
      />
    </div>
  );
}
