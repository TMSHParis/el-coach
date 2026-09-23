"use server";

import { cookies } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { COOKIE_KEYS } from "@/lib/demo-session";
import { clerkEnabled } from "@/lib/clerk";

const YEAR = 60 * 60 * 24 * 365;

async function requireUserId(): Promise<string> {
  if (!clerkEnabled) throw new Error("Connexion requise.");
  const session = await auth();
  if (!session.userId) throw new Error("Connecte-toi d'abord.");
  return session.userId;
}

export type RecordsRm = {
  squat?: string;
  deadlift?: string;
  bench?: string;
  cleanJerk?: string;
  snatch?: string;
  ohp?: string;
};

export async function updateRecordsRm(records: RecordsRm): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    await prisma.profile.update({ where: { userId }, data: { recordsRm: records } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

/**
 * Programmes actifs (page /settings · "Choix de programme"). Plusieurs peuvent
 * l'être en même temps ; le premier reste le programme "principal" (colonne
 * `programme` + cookie de programmation), celui sur lequel s'appuient le
 * dashboard et la séance tant que l'utilisateur n'en choisit pas un autre au
 * check-in. Les libellés sont ceux du catalogue ECM (avec emoji), comme dans
 * les <select> de signup et de check-in.
 */
export async function updateProgrammes(names: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const valid = names.filter((n) => n in SPORT_LABEL_TO_SLUG);
  if (valid.length === 0) return { ok: false, error: "Choisis au moins un programme." };
  try {
    const userId = await requireUserId();
    await prisma.profile.update({
      where: { userId },
      data: { programmes: valid, programme: valid[0] },
    });
    const jar = await cookies();
    jar.set(COOKIE_KEYS.program, SPORT_LABEL_TO_SLUG[valid[0]], { path: "/", maxAge: YEAR, sameSite: "lax" });
    jar.set(COOKIE_KEYS.startDate, new Date().toISOString(), { path: "/", maxAge: YEAR, sameSite: "lax" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export type NotifPrefs = {
  notifCheckinOn: boolean;
  notifCheckinTime: string;
  notifSeance: boolean;
  notifBlessure: boolean;
  notifRecap: boolean;
};

export async function updateNotifPrefs(prefs: NotifPrefs): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    await prisma.profile.update({ where: { userId }, data: prefs });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

export async function updateLangue(langue: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    await prisma.profile.update({ where: { userId }, data: { langue } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

/**
 * Suppression de compte — supprime toutes les données Postgres de
 * l'utilisateur puis son compte Clerk. Pas de résiliation Stripe réelle
 * (aucun abonnement Stripe actif tant que le paiement n'est pas configuré,
 * cf. `stripeEnabled`) — à ajouter quand Stripe sera branché (P3).
 */
export async function deleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.dashboardOutput.deleteMany({ where: { userId } }),
      prisma.checkin.deleteMany({ where: { userId } }),
      prisma.profile.deleteMany({ where: { userId } }),
    ]);
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}
