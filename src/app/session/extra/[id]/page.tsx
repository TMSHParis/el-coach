import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user-id";
import { generateNonEcmAdvice, isRestDay, type NonEcmAdvice } from "@/lib/ecm-engine";
import { buildAdviceSession } from "@/lib/advice-session";
import { isReposSubtype, isRecupSubtype, RECUP_DEFAULT_MINUTES } from "@/lib/seance-kinds";
import { getExtraActivity, saveExtraActivityResult, updateExtraActivityRecap } from "../../extra-activity-actions";
import { SessionRunnerV2, type SessionKind } from "../../session-runner-v2";
import { sessionFontVariables } from "../../session-fonts";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("sp.extra.title") };
}

const fallbackAdvice = (t: Translate): NonEcmAdvice => ({
  dureeEstimee: "30-45 min",
  warmup: [
    { nom: t("sp.extra.fb.warm1"), duree: "5 min" },
    { nom: t("sp.extra.fb.warm2"), duree: "5 min" },
  ],
  prevention: [t("sp.extra.fb.prev1"), t("sp.extra.fb.prev2")],
  mindset: t("sp.extra.fb.mind"),
});

const fallbackRestAdvice = (t: Translate): NonEcmAdvice => ({
  dureeEstimee: "20-30 min",
  warmup: [{ nom: t("sp.extra.fbRest.warm1"), duree: "10-15 min" }],
  prevention: [t("sp.extra.fbRest.prev1")],
  mindset: t("sp.extra.fbRest.mind"),
});

export default async function ExtraActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, lang } = await getT();
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
    advice = await generateNonEcmAdvice({ profile, checkin: { ...checkin, seance: activity.seance }, lang });
  } catch (err) {
    console.error("ExtraActivityPage: generateNonEcmAdvice a échoué, repli générique:", err);
    advice = isRestDay(activity.seance) ? fallbackRestAdvice(t) : fallbackAdvice(t);
  }

  const session = buildAdviceSession(activity.seance, advice, t);
  const sessionKind: SessionKind = isReposSubtype(activity.seance)
    ? "repos"
    : isRecupSubtype(activity.seance)
      ? "recuperationActive"
      : "sportHorsEcm";

  return (
    <div className={sessionFontVariables}>
      <SessionRunnerV2
        sessionName={session.titre}
        sessionMeta={t("sp.extra.meta", { d: session.dureeEstimee, n: session.blocks.length })}
        blocks={session.blocks}
        initial={session.blocks.map(() => ({ format: "nft" as const, durationMin: 10, tabataRounds: 8 }))}
        date={activity.date}
        variant="A"
        sessionKind={sessionKind}
        recuperationDefaultMinutes={RECUP_DEFAULT_MINUTES[activity.seance]}
        onSaveResult={saveExtraActivityResult.bind(null, id)}
        onUpdateRecap={updateExtraActivityRecap.bind(null, id)}
        doneRedirect={`/session/extra/${id}/recap`}
      />
    </div>
  );
}
