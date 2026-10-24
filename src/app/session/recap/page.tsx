import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { buildLastResults } from "@/lib/last-results";
import type { BlocSummary, SessionBlocResult } from "../actions";
import { getOrCreateActiveBlock } from "@/lib/training-block";
import { getChainLevels } from "@/lib/chain-progress";
import { upgradeProposals } from "@/lib/chains";
import { homeLevelForToday } from "@/lib/home-equipment";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { buildRecapBlocs, coachMessage, freeActivityMessage, mentalLabel, missingEntries, type WatchData } from "@/lib/recap-text";
import { isRestLikeSeance } from "@/lib/seance-kinds";
import { leadingEmoji, recoveryBlocks, stripLeadingEmoji, type StoredAdvice } from "@/lib/advice-session";
import { sessionFontVariables } from "../session-fonts";
import { RecapView } from "./recap-view";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("sp.recap.title") };
}

/** Page unique affichée à la fin d'une séance (et depuis le dashboard). Lecture seule :
 * l'ajout de photo (et l'analyse calories/retour narratif qui en découle) se fait
 * pendant la séance elle-même (/session), pas ici. */
export default async function RecapPage() {
  const { t, lang } = await getT();
  const userId = await getUserId();
  const date = todayKey();
  if (!userId) redirect("/dashboard");

  const [session, checkin, pastSessions, profile, output] = await Promise.all([
    prisma.session.findUnique({ where: { userId_date: { userId, date } } }),
    prisma.checkin.findUnique({ where: { userId_date: { userId, date } } }),
    prisma.session.findMany({ where: { userId, date: { lt: date } }, orderBy: { date: "desc" }, take: 12 }),
    prisma.profile.findUnique({ where: { userId }, select: { prenom: true } }),
    prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date } } }),
  ]);

  // Pas de séance terminée aujourd'hui — rien à raconter.
  if (!session?.completed) redirect("/dashboard");

  const data = session.data as { blocs?: SessionBlocResult[]; summary?: BlocSummary[] } | null;
  const results = data?.blocs ?? [];
  const previous = buildLastResults(pastSessions);
  const best = session.bestResult as { nom: string; charge: number; reps: string } | null;
  const photoAnalysis = session.photoAnalysis as {
    bpmMoyen?: number | null;
    caloriesActivite?: number | null;
    caloriesTotales?: number | null;
    dureeMontre?: string | null;
  } | null;

  const recapBlocs = buildRecapBlocs(data?.summary, results, t);
  const durationSec = session.durationSec ?? 0;
  const percent = Math.round((session.completionRate ?? 0) * 100);

  // Montre : "kcal en activité" seulement quand la montre l'a indiqué séparément.
  const watch: WatchData = {
    kcalActive: photoAnalysis?.caloriesActivite ?? null,
    kcalTotal: photoAnalysis?.caloriesTotales ?? null,
    effort: photoAnalysis?.dureeMontre ?? null,
    bpm: photoAnalysis?.bpmMoyen ?? null,
  };
  const hasWatch = watch.kcalActive !== null || watch.effort !== null || watch.bpm !== null;
  const wodBloc = recapBlocs.find((b) => b.wodLine && ["wod", "conditioning"].includes(b.type));
  // Situation A = séance d'un programme ECM ; B = toute autre activité (jamais de pourcentage).
  const situation: "A" | "B" = checkin?.seance && checkin.seance in SPORT_LABEL_TO_SLUG ? "A" : "B";
  const recup = isRestLikeSeance(checkin?.seance);
  const energy = ((session.data as { energie?: number } | null)?.energie ?? checkin?.energie) ?? null;
  const coachText =
    situation === "A"
      ? coachMessage({
          prenom: profile?.prenom ?? "",
          durationSec,
          percent,
          energie: checkin?.energie ?? null,
          mental: checkin?.mental ?? null,
          best,
          wod: wodBloc?.wodLine ? { titre: wodBloc.titre, temps: wodBloc.wodLine } : null,
        }, t)
      : freeActivityMessage({ prenom: profile?.prenom ?? "", durationSec, energie: energy, recuperation: recup }, t);
  // At Home : propose de monter d'un cran quand l'objectif de reps est atteint (jamais en semaine de décharge).
  const chainProposals =
    checkin?.seance && SPORT_LABEL_TO_SLUG[checkin.seance] === "at-home" && !(await getOrCreateActiveBlock(userId, "at-home", date)).info.isDeload
      ? upgradeProposals(results, await getChainLevels(userId), homeLevelForToday(checkin.seanceEquipement, null))
      : [];
  const missing = percent < 100 ? missingEntries(recapBlocs) : [];

  // Comparaisons : mouvements plus lourds (ou plus légers) que la dernière fois.
  const comparisons = results
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

  const dateLabel = (() => {
    const [y, m, d] = date.split("-").map(Number);
    const label = formatDate(lang, new Date(y, m - 1, d), { weekday: "short", day: "numeric", month: "long" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  })();
  const seance = checkin?.seance ?? "";

  return (
    <div className={sessionFontVariables}>
      <RecapView
        situation={situation}
        date={date}
        dateLabel={dateLabel}
        name={situation === "A" ? stripLeadingEmoji(seance) : seance ? stripLeadingEmoji(seance) : t("sp.recap.activityFallback")}
        icon={situation === "A" ? "⚡" : leadingEmoji(seance) || "🥊"}
        durationSec={durationSec}
        percent={percent}
        energy={energy}
        mental={mentalLabel(checkin?.mental, t)}
        feeling={session.sessionFeeling}
        note={session.sessionNote}
        blocs={recapBlocs}
        missing={missing}
        comparisons={comparisons}
        coachText={coachText}
        watch={hasWatch ? watch : null}
        chainProposals={chainProposals}
        recovery={situation === "B" && recup ? recoveryBlocks((output?.output as { advice?: StoredAdvice } | null)?.advice, t) : null}
      />
    </div>
  );
}
