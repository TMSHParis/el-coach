"use server";

import { cookies } from "next/headers";
import { COOKIE_KEYS, getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { todayKey } from "@/lib/date-key";
import { prisma } from "@/lib/prisma";
import { ensureUserId } from "@/lib/user-id";
import { buildSleepFromCheckins, buildWeightFromCheckins, generateEcmAnalysis, extractMainLift } from "@/lib/ecm-engine";
import {
  computeEcmScore,
  buildStack4Moments,
  buildSnack,
  buildAlerts,
  recommendVariant,
} from "@/lib/coaching-adaptatif-mock";
import type { Prisma } from "@prisma/client";
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
};

// todayKey() vit dans lib/date-key.ts (pas ici) : un fichier "use server" ne
// peut exporter que des fonctions async — voir ce fichier pour le partager
// avec dashboard/page.tsx (Server Component).

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

  let analysis: Omit<Awaited<ReturnType<typeof generateEcmAnalysis>>, "generatedDay"> & {
    generatedDay?: Awaited<ReturnType<typeof generateEcmAnalysis>>["generatedDay"];
  };
  try {
    analysis = await generateEcmAnalysis({ profile, checkin, sleep, weight, recentCheckins, recentMainLifts, weekTypeFocus });
  } catch (err) {
    console.error("generateEcmAnalysis a échoué, repli sur l'analyse déterministe:", err);
    const ecm = computeEcmScore(fatigueScore);
    const reco = recommendVariant(ecm);
    analysis = {
      ecm,
      recommendedVariant: reco.recommended,
      recommendedReason: reco.reason,
      stack: buildStack4Moments(fatigueScore),
      alerts: buildAlerts(fatigueScore, sleep).filter((a) => a.category !== "sleep"),
      snack: buildSnack(fatigueScore),
      // Pas de generatedDay : le dashboard retombe sur resolveTodaySession (programme fixe).
    };
  }

  const sleepAlerts = sleep.alerts.map((message) => ({
    level: (message.startsWith("Sommeil profond") ? "warning" : "info") as "warning" | "info",
    category: "sleep" as const,
    message,
    hint: "Magnésium augmenté ce soir · écrans off 21h.",
  }));

  const output = {
    ecm: analysis.ecm,
    recommendedVariant: analysis.recommendedVariant,
    recommendedReason: analysis.recommendedReason,
    stack: analysis.stack,
    alerts: [...sleepAlerts, ...analysis.alerts],
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
