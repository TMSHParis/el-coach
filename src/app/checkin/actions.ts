"use server";

import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/lib/demo-session";

const YEAR = 60 * 60 * 24 * 365;
const COOKIE_CHECKIN_DATE = "el_coach_checkin_date";
const COOKIE_CHECKIN_DATA = "el_coach_checkin";

export type CheckinGender = "h" | "f";

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

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/**
 * Convertit les réponses du check-in en fatigueScore 0-10 (0 = frais, 10 = épuisé)
 * pour alimenter le mock Coaching Adaptatif existant (dashboard, séances adaptatives).
 * Sera remplacé par le vrai moteur Claude Sonnet 4 à l'Étape 2.5 (croisement profil + check-in).
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

  return { ok: true, fatigueScore };
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
