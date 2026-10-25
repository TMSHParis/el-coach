"use server";

import { cookies } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { COOKIE_KEYS } from "@/lib/demo-session";
import { clerkEnabled } from "@/lib/clerk";
import { LANG_COOKIE, isLang } from "@/lib/i18n/lang";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import { addDays, localParts } from "@/lib/notifications/time";
import { sendTestNotification } from "@/lib/notifications/run";
import { makeT } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";

const YEAR = 60 * 60 * 24 * 365;

async function genericError(): Promise<string> {
  return makeT(await getLang())("err.generic");
}

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
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
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
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
  }
}

export type NotifPrefs = {
  notifCheckinOn: boolean;
  notifCheckinTime: string;
  notifSeance: boolean;
  notifBlessure: boolean;
  notifRecap: boolean;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Date « YYYY-MM-DD » de demain dans le fuseau de l'appareil de l'utilisateur. */
function tomorrowKey(tz: string | null): string {
  return addDays(localParts(new Date(), tz || "Europe/Paris").dateKey, 1);
}

/**
 * Réglages de notifications. Changer l'heure du rappel check-in s'applique dès le lendemain :
 * l'ancienne heure reste valable jusqu'à `notifCheckinTimeFrom`.
 */
export async function updateNotifPrefs(prefs: NotifPrefs, timezone?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    const current = await prisma.profile.findUnique({ where: { userId }, select: { notifCheckinTime: true, timezone: true } });
    if (!TIME_RE.test(prefs.notifCheckinTime)) throw new Error("Heure invalide.");
    const tz = timezone || current?.timezone || null;
    const timeChanged = !!current && (current.notifCheckinTime ?? "07:00") !== prefs.notifCheckinTime;
    await prisma.profile.update({
      where: { userId },
      data: {
        ...prefs,
        ...(tz ? { timezone: tz } : {}),
        ...(timeChanged
          ? { notifCheckinTimePrev: current?.notifCheckinTime ?? "07:00", notifCheckinTimeFrom: tomorrowKey(tz) }
          : {}),
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
  }
}

/** Appareil déduit du user-agent : "iphone" | "android" | "ordinateur". */
function deviceFromUserAgent(ua: string | undefined): "iphone" | "android" | "ordinateur" {
  const u = ua ?? "";
  if (/iPhone|iPad|iPod/.test(u)) return "iphone";
  if (/Android/.test(u)) return "android";
  return "ordinateur";
}

export type PushSubscriptionInput = { endpoint: string; p256dh: string; auth: string; userAgent?: string; timezone?: string };

/** Enregistre l'abonnement push de cet appareil dans le profil. */
export async function savePushSubscription(sub: PushSubscriptionInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    if (!sub.endpoint || !sub.p256dh || !sub.auth) throw new Error("Abonnement invalide.");
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: { userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, userAgent: sub.userAgent?.slice(0, 300), device: deviceFromUserAgent(sub.userAgent) },
      update: { userId, p256dh: sub.p256dh, auth: sub.auth, userAgent: sub.userAgent?.slice(0, 300), device: deviceFromUserAgent(sub.userAgent) },
    });
    if (sub.timezone) await prisma.profile.update({ where: { userId }, data: { timezone: sub.timezone } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
  }
}

/** Envoie la notification de test à l'appareil qui la demande. */
export async function sendTestPush(endpoint: string): Promise<{ ok: true } | { ok: false; reason: "no-subscription" | "failed" }> {
  try {
    const userId = await requireUserId();
    const res = await sendTestNotification(userId, endpoint);
    return res.ok ? { ok: true } : { ok: false, reason: res.reason === "no-subscription" ? "no-subscription" : "failed" };
  } catch (err) {
    console.error("sendTestPush", err);
    return { ok: false, reason: "failed" };
  }
}

/** À chaque ouverture de l'app : garde le fuseau de l'appareil à jour (les heures de rappel en dépendent). */
export async function syncTimezone(timezone: string): Promise<void> {
  try {
    const userId = await requireUserId();
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    } catch {
      return;
    }
    await prisma.profile.updateMany({ where: { userId, NOT: { timezone } }, data: { timezone } });
  } catch {
    /* non connecté ou profil absent : rien à synchroniser */
  }
}

export async function removePushSubscription(endpoint: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
  }
}

export async function updateLangue(langue: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!isLang(langue)) throw new Error("Langue inconnue.");
    const userId = await requireUserId();
    await prisma.profile.update({ where: { userId }, data: { langue } });
    const jar = await cookies();
    jar.set(LANG_COOKIE, langue, { path: "/", maxAge: YEAR, sameSite: "lax" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
  }
}

export async function updateTheme(theme: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!isTheme(theme)) throw new Error("Thème inconnu.");
    const userId = await requireUserId();
    await prisma.profile.update({ where: { userId }, data: { theme } });
    const jar = await cookies();
    jar.set(THEME_COOKIE, theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
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
    return { ok: false, error: err instanceof Error ? err.message : await genericError() };
  }
}
