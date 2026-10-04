import { redirect } from "next/navigation";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import type { Day } from "@/lib/programming";
import { adaptDayForInjuries, detectInjuryAreas, reduceVolume } from "@/lib/session-adapt";
import { toDisplayBlocks, defaultRuntimeFormat, defaultDurationMinutes } from "@/lib/session-format";
import { minutesToHM } from "../dashboard/dashboard-helpers";
import { buildAdviceSession, type StoredAdvice } from "@/lib/advice-session";
import { isReposSubtype, isRecupSubtype, RECUP_DEFAULT_MINUTES } from "@/lib/seance-kinds";
import { buildLastResults } from "@/lib/last-results";
import { blobEnabled } from "@/lib/blob";
import type { HistoriqueSession } from "@/app/api/extract-photo-data/route";
import { SessionRunnerV2 } from "./session-runner-v2";
import { sessionFontVariables } from "./session-fonts";

export const metadata = { title: "Séance en cours — EL COACH METHOD" };

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant: variantParam } = await searchParams;
  const variant = variantParam === "b" ? "b" : "a";

  const userId = await getUserId();
  const [profile, todayCheckin, dbOutput, pastSessions, todaySession] = userId
    ? await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.checkin.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
        prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
        // Dernières séances : servent à rappeler "dernière fois : 100 kg × 5" et à suggérer la charge.
        prisma.session.findMany({
          where: { userId, date: { lt: todayKey() } },
          orderBy: { date: "desc" },
          take: 12,
        }),
        prisma.session.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
      ])
    : [null, null, null, [], null];

  const lastResults = buildLastResults(pastSessions);

  // Contexte transmis à l'analyse Claude d'une photo ajoutée en fin de séance
  // (calories, retour narratif comparé à l'historique) — mêmes données que
  // sur /session/recap, l'ajout de photo se faisant maintenant ici.
  const sport = todayCheckin?.seance ?? "Séance";
  const prenom = profile?.prenom ?? null;
  const poidsJour = todayCheckin?.poids ?? (profile?.poids ? String(profile.poids) : null);
  const historiqueRecent: HistoriqueSession[] = pastSessions.slice(0, 8).map((s) => ({
    date: s.date,
    calories: s.caloriesBrulees,
    durationSec: s.durationSec,
    feeling: s.sessionFeeling,
    donneesBrutes: (s.photoAnalysis as { donneesBrutes?: Record<string, unknown> | null } | null)?.donneesBrutes ?? null,
  }));

  const output = dbOutput?.output as { generatedDay?: Day; mode?: string; advice?: StoredAdvice } | null;

  // Jour hors ECM (sport libre), repos ou récupération active : la séance est
  // la routine en 3 blocs générée au check-in. Le comportement de chrono
  // diffère du parcours ECM (voir sessionKind, thread jusqu'à SessionRunnerV2) :
  // repos → pas de chrono du tout, sport hors ECM/récup → un seul chrono général
  // (déjà affiché en permanence dans le bandeau du haut) au lieu d'un chrono par bloc.
  if (output?.mode === "advice" && output.advice) {
    const seance = todayCheckin?.seance ?? null;
    const advice = buildAdviceSession(seance, output.advice);
    const sessionKind: "sportHorsEcm" | "repos" | "recuperationActive" = isReposSubtype(seance)
      ? "repos"
      : isRecupSubtype(seance)
        ? "recuperationActive"
        : "sportHorsEcm";
    return (
      <div className={sessionFontVariables}>
        <SessionRunnerV2
          sessionName={advice.titre}
          sessionMeta={`${advice.dureeEstimee} · ${advice.blocks.length} blocs`}
          blocks={advice.blocks}
          initial={advice.blocks.map(() => ({ format: "nft" as const, durationMin: 10, tabataRounds: 8 }))}
          date={todayKey()}
          variant="A"
          lastResults={lastResults}
          initialPhotos={todaySession?.photos ?? []}
          photosEnabled={blobEnabled}
          analysisContext={{ sport, prenom, poidsJour, historiqueRecent }}
          sessionKind={sessionKind}
          recuperationDefaultMinutes={seance ? RECUP_DEFAULT_MINUTES[seance] : undefined}
        />
      </div>
    );
  }

  // À partir d'ici, uniquement les jours ECM réels (pas d'advice ci-dessus) :
  // la programmation (choix fait dans les réglages) devient nécessaire pour
  // composer le contenu de la séance — repos/récup/hors-ECM ne sont jamais
  // concernés par ce garde-fou, voir le early-return ci-dessus.
  const demo = await getDemoState();
  if (!demo.programSlug) redirect("/onboarding");

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore);
  if (!today) redirect("/dashboard");

  const generatedDay = output?.generatedDay;

  // Sans séance générée, on retombe sur le programme fixe hebdomadaire — mêmes
  // garde-fous qu'avant (jour adaptatif pas encore calibré / jour de repos).
  if (!generatedDay && (today.needsFatigueInput || today.day.blocks.length === 0)) {
    redirect("/dashboard");
  }

  const baseDay = generatedDay ?? today.day;
  const sessionTitle = generatedDay ? baseDay.focus : `${today.template.name} — ${baseDay.focus}`;

  const injuryAreas = detectInjuryAreas(
    profile?.blessures ? profile.blessuresDetail : null,
    todayCheckin?.douleur ? todayCheckin.douleurDetail : null,
  );
  const { day: safeDay } = adaptDayForInjuries(baseDay, injuryAreas);
  const day = variant === "b" ? reduceVolume(safeDay) : safeDay;

  const displayBlocks = toDisplayBlocks(day.blocks);
  const initial = day.blocks.map((b) => ({
    format: defaultRuntimeFormat(b),
    durationMin: defaultDurationMinutes(b),
    tabataRounds: b.rounds ?? 8,
  }));

  return (
    <div className={sessionFontVariables}>
      <SessionRunnerV2
        sessionName={sessionTitle}
        sessionMeta={`${minutesToHM(day.estimatedMinutes)} · ${displayBlocks.length} blocs`}
        blocks={displayBlocks}
        initial={initial}
        date={todayKey()}
        variant={variant === "b" ? "B" : "A"}
        lastResults={lastResults}
        initialPhotos={todaySession?.photos ?? []}
        photosEnabled={blobEnabled}
        analysisContext={{ sport, prenom, poidsJour, historiqueRecent }}
      />
    </div>
  );
}
