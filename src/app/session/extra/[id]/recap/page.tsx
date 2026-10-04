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

  const photoAnalysis = activity.photoAnalysis as { retourNarratif?: string | null } | null;

  return (
    <div className={sessionFontVariables}>
      <RecapView
        date={activity.date}
        sport={activity.seance}
        durationSec={activity.durationSec ?? 0}
        completionRate={activity.completionRate ?? 0}
        feeling={activity.sessionFeeling}
        note={activity.sessionNote}
        calories={activity.caloriesBrulees}
        caloriesSource={activity.caloriesSource}
        retourNarratif={photoAnalysis?.retourNarratif ?? null}
        best={activity.bestResult as { nom: string; charge: number; reps: string } | null}
        comparisons={[]}
        blocs={[]}
        congrats={activity.coachMessage}
        onUpdate={updateExtraActivityRecap.bind(null, id)}
      />
    </div>
  );
}
