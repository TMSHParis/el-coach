import { redirect } from "next/navigation";
import { getExtraActivity, updateExtraActivityRecap } from "../../../extra-activity-actions";
import { sessionFontVariables } from "../../../session-fonts";
import { RecapView } from "../../../recap/recap-view";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { isRestLikeSeance } from "@/lib/seance-kinds";
import { freeActivityMessage } from "@/lib/recap-text";
import { leadingEmoji, recoveryBlocks, stripLeadingEmoji } from "@/lib/advice-session";

export const metadata = { title: "Compte rendu — EL COACH METHOD" };

/** Compte rendu d'une 2e (ou 3e...) activité du jour — même page que /session/recap
 * mais source ExtraActivity. Pas de comparaisons historique/mouvement par mouvement :
 * ces activités n'ont pas le suivi détaillé des séances ECM. */
export default async function ExtraActivityRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getExtraActivity(id);
  if (!activity || !activity.completed) redirect("/dashboard");

  const situation: "A" | "B" = activity.seance in SPORT_LABEL_TO_SLUG ? "A" : "B";
  const [y, m, d] = activity.date.split("-").map(Number);
  const dl = new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
  const recup = isRestLikeSeance(activity.seance);

  return (
    <div className={sessionFontVariables}>
      <RecapView
        situation={situation}
        date={activity.date}
        dateLabel={dl.charAt(0).toUpperCase() + dl.slice(1)}
        name={stripLeadingEmoji(activity.seance)}
        icon={leadingEmoji(activity.seance) || (situation === "A" ? "⚡" : "🥊")}
        durationSec={activity.durationSec ?? 0}
        percent={Math.round((activity.completionRate ?? 0) * 100)}
        energy={(activity.data as { energie?: number } | null)?.energie ?? null}
        mental={null}
        feeling={activity.sessionFeeling}
        note={activity.sessionNote}
        blocs={[]}
        missing={[]}
        comparisons={[]}
        coachText={situation === "A" ? activity.coachMessage : freeActivityMessage({ prenom: "", durationSec: activity.durationSec ?? 0, energie: null, recuperation: recup })}
        watch={activity.caloriesBrulees !== null ? { kcalActive: null, kcalTotal: null, effort: null, bpm: null, kcalUnknown: activity.caloriesBrulees } : null}
        recovery={situation === "B" && recup ? recoveryBlocks(null) : null}
        onUpdate={updateExtraActivityRecap.bind(null, id)}
      />
    </div>
  );
}
