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

  const demo = await getDemoState();
  if (!demo.programSlug) redirect("/onboarding");

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore);
  if (!today) redirect("/dashboard");

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

  // Jour hors ECM (sport libre) ou repos : la séance est la routine en 3 blocs
  // générée au check-in — même moteur de chrono, sans variante allégée.
  if (output?.mode === "advice" && output.advice) {
    const advice = buildAdviceSession(todayCheckin?.seance ?? null, output.advice);
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
        />
      </div>
    );
  }

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
