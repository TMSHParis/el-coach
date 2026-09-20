"use server";

import { cookies } from "next/headers";
import { COOKIE_KEYS, getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { todayKey } from "@/lib/date-key";
import { prisma } from "@/lib/prisma";
import { ensureUserId } from "@/lib/user-id";
import {
  buildSleepFromCheckins,
  buildWeightFromCheckins,
  generateEcmAnalysis,
  generateNonEcmAdvice,
  generateMindsetMessage,
  extractMainLift,
  isRestDay,
  type NonEcmAdvice,
  type EcmAnalysisResult,
  type EcmStateAnalysisResult,
} from "@/lib/ecm-engine";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import {
  computeEcmScore,
  buildStack4Moments,
  buildSnack,
  buildAlerts,
  recommendVariant,
} from "@/lib/coaching-adaptatif-mock";
import type { Prisma } from "@prisma/client";
import type { SleepInsight } from "@/lib/coaching-adaptatif-mock";
import type { Day } from "@/lib/programming";

const YEAR = 60 * 60 * 24 * 365;
const COOKIE_CHECKIN_DATE = "el_coach_checkin_date";
const COOKIE_CHECKIN_DATA = "el_coach_checkin";

export type CheckinGender = "h" | "f";

export type SleepPhotoAnalysis = {
  total: string | null;
  lent: string | null;
  rem: string | null;
  profond: string | null;
  eveil: string | null;
  coucher: string | null;
  reveil: string | null;
  alertes: string[];
  source: string | null;
};

export type CheckinPayload = {
  genre: CheckinGender;
  // Sommeil
  sleepPhoto: boolean;
  sleepCoucher: string;
  sleepReveil: string;
  sleepDuree: string;
  sleepFc: string;
  sleepHrv: string;
  sleepRecup: string;
  sleepAnalysis?: SleepPhotoAnalysis | null;
  // Corps
  poids: string;
  jambes: string;
  douleur: boolean | null;
  douleurDetail: string;
  // Cycle (femme)
  cycle: boolean | null;
  cycleDouleur: string;
  cycleJour: string;
  // Vitalité
  energie: number | null;
  motivation: number | null;
  // Mental
  mental: string;
  stress: string;
  libido: string;
  // Planning
  seance: string;
  travail: boolean | null;
  soirPerformance: boolean | null;
  // Notes
  notes: string;
  // Personnalisation facultative de la séance du jour
  seanceFocus: string[];
  seanceDuree: string;
  seanceEquipement: string;
  seanceIntensite: string;
  seanceNote: string;
};

// todayKey() vit dans lib/date-key.ts (pas ici) : un fichier "use server" ne
// peut exporter que des fonctions async — voir ce fichier pour le partager
// avec dashboard/page.tsx (Server Component).

/** Vrai si `seance` correspond à l'un des 5 programmes ECM catalogués (mêmes libellés que le signup). */
function isEcmProgram(seance: string | null | undefined): boolean {
  return Boolean(seance && SPORT_LABEL_TO_SLUG[seance]);
}

const FALLBACK_ADVICE: NonEcmAdvice = {
  dureeEstimee: "45-60 min",
  warmup: [
    { nom: "Mobilité articulaire générale", duree: "5 min" },
    { nom: "Montée progressive en intensité", duree: "5 min" },
    { nom: "Activation gainage et fessiers", duree: "3 min" },
  ],
  prevention: ["Hydrate-toi avant et pendant l'effort.", "Arrête ou ralentis en cas de douleur inhabituelle."],
  mindset: "Fais de ton mieux aujourd'hui, à ton rythme.",
};

const FALLBACK_REST_ADVICE: NonEcmAdvice = {
  dureeEstimee: "20-30 min",
  warmup: [
    { nom: "Étirements doux, sans forcer", duree: "10-15 min" },
    { nom: "Marche tranquille", duree: "20 min" },
    { nom: "Hydratation régulière sur la journée", duree: "2 L" },
  ],
  prevention: ["Évite les efforts intenses aujourd'hui.", "Surveille toute douleur qui persiste au repos."],
  mindset: "Le repos fait partie de l'entraînement. Tu progresses aussi aujourd'hui.",
};

/** Message mindset de repli (sans Claude) — ton calé sur l'énergie du check-in. */
function fallbackMindset(prenom: string, payload: { energie: number | null; seance: string | null }): string {
  const nom = prenom || "Athlète";
  if (isRestDay(payload.seance)) {
    return `Jour de repos, ${nom}. Récupère bien — c'est là que le vrai travail se fait.`;
  }
  const energie = payload.energie ?? 5;
  if (energie >= 8) return `${nom}, t'es dans le vert aujourd'hui. Profites-en pour pousser les limites.`;
  if (energie >= 5) return `Pas le meilleur jour, ${nom}. Mais tu t'es levé et tu vas le faire. C'est ça qui compte.`;
  return `${nom}, ton corps est dans le rouge. Séance légère aujourd'hui. Pas d'ego.`;
}

/** Analyse déterministe (moteur mock) quand l'appel Claude échoue. */
function fallbackAnalysis(fatigueScore: number, sleep: SleepInsight) {
  const ecm = computeEcmScore(fatigueScore);
  const reco = recommendVariant(ecm);
  return {
    ecm,
    recommendedVariant: reco.recommended,
    recommendedReason: reco.reason,
    stack: buildStack4Moments(fatigueScore),
    alerts: buildAlerts(fatigueScore, sleep).filter((a) => a.category !== "sleep"),
    snack: buildSnack(fatigueScore),
  };
}

/** Alertes sommeil calculées en code (pas par Claude) à partir des vrais check-ins. */
function sleepAlertsFrom(sleep: SleepInsight) {
  return sleep.alerts.map((message) => ({
    level: (message.startsWith("Sommeil profond") ? "warning" : "info") as "warning" | "info",
    category: "sleep" as const,
    message,
    hint: "Magnésium augmenté ce soir · écrans off 21h.",
  }));
}

/**
 * Convertit les réponses du check-in en fatigueScore 0-10 (0 = frais, 10 = épuisé)
 * pour alimenter le moteur de programmation adaptative (programming.ts) qui
 * choisit le contenu réel de la séance du jour.
 */
function computeFatigueScore(payload: CheckinPayload): number {
  let fatigue = 10 - (payload.energie ?? 5);
  if (payload.jambes === "🪨 Lourdes") fatigue += 2;
  else if (payload.jambes === "⚡ Légèrement lourdes") fatigue += 1;
  if (payload.mental === "🌫 Brouillard") fatigue += 2;
  else if (payload.mental === "🌤 Moyen") fatigue += 1;
  if (payload.stress === "😰 Élevé") fatigue += 2;
  else if (payload.stress === "😐 Modéré") fatigue += 1;
  if (payload.douleur) fatigue += 1;
  if (payload.cycle && payload.cycleDouleur === "🔴 Intenses") fatigue += 1;
  return Math.max(0, Math.min(10, Math.round(fatigue)));
}

export async function submitCheckin(
  payload: CheckinPayload,
): Promise<{ ok: true; fatigueScore: number } | { ok: false; error: string }> {
  if (!payload.jambes || payload.douleur === null || !payload.energie || !payload.motivation) {
    return { ok: false, error: "Complète les champs requis avant de valider." };
  }

  const fatigueScore = computeFatigueScore(payload);
  const jar = await cookies();

  jar.set(COOKIE_KEYS.fatigue, String(fatigueScore), {
    path: "/",
    maxAge: 60 * 60 * 20, // expire 20h → refresh chaque matin, cohérent avec setFatigue (dashboard/actions.ts)
    sameSite: "lax",
  });
  jar.set(COOKIE_CHECKIN_DATE, todayKey(), { path: "/", maxAge: 60 * 60 * 20, sameSite: "lax" });
  jar.set(COOKIE_CHECKIN_DATA, JSON.stringify(payload), { path: "/", maxAge: YEAR, sameSite: "lax" });

  // Persistance réelle (Postgres) + génération Claude — best effort : si ça échoue
  // (pas de profil ECM, clé API absente, erreur réseau...), le check-in reste
  // validé et le dashboard retombe sur le moteur mock existant.
  try {
    await persistCheckinAndGenerateDashboard(payload, fatigueScore);
  } catch (err) {
    console.error("submitCheckin: persistance/génération ECM échouée:", err);
  }

  return { ok: true, fatigueScore };
}

async function persistCheckinAndGenerateDashboard(payload: CheckinPayload, fatigueScore: number) {
  const userId = await ensureUserId();
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return; // Pas de profil ECM (signup pas complété) → mode mock inchangé.

  const date = todayKey();
  const data: Prisma.CheckinUncheckedCreateInput = {
    userId,
    date,
    genre: payload.genre,
    energie: payload.energie,
    motivation: payload.motivation,
    mental: payload.mental || null,
    stress: payload.stress || null,
    libido: payload.libido || null,
    jambes: payload.jambes || null,
    douleur: payload.douleur,
    douleurDetail: payload.douleurDetail || null,
    sleepPhoto: payload.sleepPhoto,
    sleepCoucher: payload.sleepCoucher || null,
    sleepReveil: payload.sleepReveil || null,
    sleepDuree: payload.sleepDuree || null,
    sleepFc: payload.sleepFc || null,
    sleepHrv: payload.sleepHrv || null,
    sleepRecup: payload.sleepRecup || null,
    sleepAnalysis: (payload.sleepAnalysis ?? undefined) as Prisma.InputJsonValue,
    poids: payload.poids || null,
    seance: payload.seance || null,
    travail: payload.travail,
    soirPerformance: payload.soirPerformance,
    cycle: payload.cycle,
    cycleDouleur: payload.cycleDouleur || null,
    cycleJour: payload.cycleJour || null,
    notes: payload.notes || null,
    seanceFocus: payload.seanceFocus,
    seanceDuree: payload.seanceDuree || null,
    seanceEquipement: payload.seanceEquipement || null,
    seanceIntensite: payload.seanceIntensite || null,
    seanceNote: payload.seanceNote || null,
  };

  const checkin = await prisma.checkin.upsert({
    where: { userId_date: { userId, date } },
    create: data,
    update: data,
  });

  if (!profile.genre) {
    await prisma.profile.update({ where: { userId }, data: { genre: payload.genre } });
    profile.genre = payload.genre;
  }

  // Le poids du jour (check-in) devient la référence du profil — l'historique
  // des pesées reste dans checkins.poids, seule la valeur "actuelle" est synchro.
  const poidsDuJour = parseFloat(payload.poids);
  if (payload.poids && Number.isFinite(poidsDuJour) && poidsDuJour > 0) {
    await prisma.profile.update({ where: { userId }, data: { poids: poidsDuJour } });
    profile.poids = poidsDuJour;
  }

  const recentCheckins = await prisma.checkin.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
  });

  const sleep = buildSleepFromCheckins(recentCheckins);
  const weight = buildWeightFromCheckins(recentCheckins);

  // Message mindset de la page intermédiaire post-check-in — best effort,
  // repli déterministe si Claude échoue (la page ne doit jamais rester vide).
  const mindsetPromise = generateMindsetMessage({ profile, checkin }).catch((err) => {
    console.error("generateMindsetMessage a échoué, repli sur un message générique:", err);
    return fallbackMindset(profile.prenom, checkin);
  });

  // Activité hors des 5 programmes ECM (ou repos) → même dashboard complet
  // (score, stack, alertes, en-cas, sommeil, poids), seul le bloc séance change :
  // conseils échauffement/prévention/mindset (ou récupération/vigilance/mindset
  // repos) à la place de Séance A/B.
  if (!isEcmProgram(checkin.seance)) {
    const [analysis, advice] = await Promise.all([
      generateEcmAnalysis({ profile, checkin, sleep, weight, recentCheckins, withSession: false }).catch((err) => {
        console.error("generateEcmAnalysis (sans séance) a échoué, repli sur l'analyse déterministe:", err);
        return fallbackAnalysis(fatigueScore, sleep);
      }),
      generateNonEcmAdvice({ profile, checkin }).catch((err) => {
        console.error("generateNonEcmAdvice a échoué, repli sur des conseils génériques:", err);
        return isRestDay(checkin.seance) ? FALLBACK_REST_ADVICE : FALLBACK_ADVICE;
      }),
    ]);
    const output = {
      mode: "advice" as const,
      ...analysis,
      mindsetMessage: await mindsetPromise,
      alerts: [...sleepAlertsFrom(sleep), ...analysis.alerts],
      sleep,
      weight,
      advice,
      generatedAt: new Date().toISOString(),
    };
    await prisma.dashboardOutput.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, output: output as Prisma.InputJsonValue },
      update: { output: output as Prisma.InputJsonValue },
    });
    return;
  }

  // Rotation 14 jours : movementId du "main lift" (bloc strength) des dashboardOutputs
  // récents — passé au générateur pour éviter de répéter le même mouvement principal.
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const recentOutputs = await prisma.dashboardOutput.findMany({
    where: { userId, date: { gte: since.toISOString().slice(0, 10) } },
    orderBy: { date: "desc" },
    take: 14,
  });
  const recentMainLifts = recentOutputs
    .map((o) => extractMainLift((o.output as { generatedDay?: Day })?.generatedDay))
    .filter((id): id is string => Boolean(id));

  // Semaine type de référence (programme fixe) — le check-in la remplace pour
  // le jour si le sport diffère de l'habituel ou qu'une note est renseignée.
  const demo = await getDemoState();
  const weekTypeFocus = demo.programSlug
    ? (resolveTodaySession(demo.programSlug, demo.fatigueScore)?.day.focus ?? null)
    : null;

  let analysis: EcmStateAnalysisResult & { generatedDay?: EcmAnalysisResult["generatedDay"] };
  try {
    analysis = await generateEcmAnalysis({ profile, checkin, sleep, weight, recentCheckins, recentMainLifts, weekTypeFocus });
  } catch (err) {
    console.error("generateEcmAnalysis a échoué, repli sur l'analyse déterministe:", err);
    // Pas de generatedDay : le dashboard retombe sur resolveTodaySession (programme fixe).
    analysis = fallbackAnalysis(fatigueScore, sleep);
  }

  const output = {
    mode: "ecm" as const,
    mindsetMessage: await mindsetPromise,
    ecm: analysis.ecm,
    recommendedVariant: analysis.recommendedVariant,
    recommendedReason: analysis.recommendedReason,
    stack: analysis.stack,
    alerts: [...sleepAlertsFrom(sleep), ...analysis.alerts],
    snack: analysis.snack,
    sleep,
    weight,
    generatedDay: analysis.generatedDay,
    generatedAt: new Date().toISOString(),
  };

  await prisma.dashboardOutput.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, output: output as Prisma.InputJsonValue },
    update: { output: output as Prisma.InputJsonValue },
  });
}

export async function isCheckinDoneToday(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE_CHECKIN_DATE)?.value === todayKey();
}

export async function getLastCheckin(): Promise<CheckinPayload | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_CHECKIN_DATA)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckinPayload;
  } catch {
    return null;
  }
}
