import { redirect } from "next/navigation";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { buildLastResults } from "@/lib/last-results";
import { blobEnabled } from "@/lib/blob";
import type { SessionBlocResult } from "../actions";
import { sessionFontVariables } from "../session-fonts";
import { RecapView } from "./recap-view";

export const metadata = { title: "Compte rendu de séance — EL COACH METHOD" };

/** Page unique affichée à la fin d'une séance (et depuis le dashboard). */
export default async function RecapPage() {
  const userId = await getUserId();
  const date = todayKey();
  if (!userId) redirect("/dashboard");

  const [session, checkin, output, pastSessions] = await Promise.all([
    prisma.session.findUnique({ where: { userId_date: { userId, date } } }),
    prisma.checkin.findUnique({ where: { userId_date: { userId, date } } }),
    prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date } } }),
    prisma.session.findMany({ where: { userId, date: { lt: date } }, orderBy: { date: "desc" }, take: 12 }),
  ]);

  // Pas de séance terminée aujourd'hui — rien à raconter.
  if (!session?.completed) redirect("/dashboard");

  const blocs = ((session.data as { blocs?: SessionBlocResult[] } | null)?.blocs ?? []).filter(
    (b) => b.series?.length || b.temps || b.rounds || b.score,
  );
  const previous = buildLastResults(pastSessions);
  const best = session.bestResult as { nom: string; charge: number; reps: string } | null;
  const congrats = (output?.output as { sessionMessage?: string } | null)?.sessionMessage ?? null;

  // Comparaisons : mouvements plus lourds (ou plus légers) que la dernière fois.
  const comparisons = blocs
    .flatMap((bloc) => {
      const last = previous[bloc.nom];
      const top = (bloc.series ?? [])
        .map((s) => parseFloat(s.charge))
        .filter((c) => Number.isFinite(c) && c > 0)
        .sort((a, b) => b - a)[0];
      if (!last || top === undefined) return [];
      const delta = Math.round((top - last.charge) * 10) / 10;
      return [{ nom: bloc.nom, delta, charge: top }];
    })
    .filter((c) => c.delta !== 0)
    .slice(0, 4);

  return (
    <div className={sessionFontVariables}>
      <RecapView
        date={date}
        sport={checkin?.seance ?? "Séance"}
        durationSec={session.durationSec ?? 0}
        completionRate={session.completionRate ?? 0}
        feeling={session.sessionFeeling}
        note={session.sessionNote}
        calories={session.caloriesBrulees}
        photos={session.photos}
        photosEnabled={blobEnabled}
        best={best}
        comparisons={comparisons}
        blocs={blocs}
        congrats={congrats}
      />
    </div>
  );
}
