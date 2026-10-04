import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user-id";
import { generateNonEcmAdvice, isRestDay, type NonEcmAdvice } from "@/lib/ecm-engine";
import { buildAdviceSession } from "@/lib/advice-session";
import { isReposSubtype, isRecupSubtype, RECUP_DEFAULT_MINUTES } from "@/lib/seance-kinds";
import { getExtraActivity, saveExtraActivityResult, updateExtraActivityRecap } from "../../extra-activity-actions";
import { SessionRunnerV2, type SessionKind } from "../../session-runner-v2";
import { sessionFontVariables } from "../../session-fonts";

export const metadata = { title: "2e activité — EL COACH METHOD" };

const FALLBACK_ADVICE: NonEcmAdvice = {
  dureeEstimee: "30-45 min",
  warmup: [
    { nom: "Mobilité articulaire générale", duree: "5 min" },
    { nom: "Montée progressive en intensité", duree: "5 min" },
  ],
  prevention: ["Hydrate-toi avant et pendant l'effort.", "Arrête ou ralentis en cas de douleur inhabituelle."],
  mindset: "Deuxième activité du jour — écoute ton corps, ce n'est pas une compétition.",
};

const FALLBACK_REST_ADVICE: NonEcmAdvice = {
  dureeEstimee: "20-30 min",
  warmup: [{ nom: "Étirements doux, sans forcer", duree: "10-15 min" }],
  prevention: ["Évite les efforts intenses aujourd'hui."],
  mindset: "Le repos fait aussi partie de l'entraînement.",
};

export default async function ExtraActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getExtraActivity(id);
  if (!activity || activity.completed) redirect("/dashboard");

  const userId = await getUserId();
  const [profile, checkin] = userId
    ? await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.checkin.findUnique({ where: { userId_date: { userId, date: activity.date } } }),
      ])
    : [null, null];
  if (!profile || !checkin) redirect("/dashboard");

  let advice: NonEcmAdvice;
  try {
    advice = await generateNonEcmAdvice({ profile, checkin: { ...checkin, seance: activity.seance } });
  } catch (err) {
    console.error("ExtraActivityPage: generateNonEcmAdvice a échoué, repli générique:", err);
    advice = isRestDay(activity.seance) ? FALLBACK_REST_ADVICE : FALLBACK_ADVICE;
  }

  const session = buildAdviceSession(activity.seance, advice);
  const sessionKind: SessionKind = isReposSubtype(activity.seance)
    ? "repos"
    : isRecupSubtype(activity.seance)
      ? "recuperationActive"
      : "sportHorsEcm";

  return (
    <div className={sessionFontVariables}>
      <SessionRunnerV2
        sessionName={session.titre}
        sessionMeta={`${session.dureeEstimee} · ${session.blocks.length} blocs`}
        blocks={session.blocks}
        initial={session.blocks.map(() => ({ format: "nft" as const, durationMin: 10, tabataRounds: 8 }))}
        date={activity.date}
        variant="A"
        sessionKind={sessionKind}
        recuperationDefaultMinutes={RECUP_DEFAULT_MINUTES[activity.seance]}
        onSaveResult={saveExtraActivityResult.bind(null, id)}
        onUpdateRecap={updateExtraActivityRecap.bind(null, id)}
        doneRedirect="/dashboard"
      />
    </div>
  );
}
