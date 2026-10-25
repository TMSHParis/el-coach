import "server-only";
// Tâche planifiée des notifications push (partie 5, mission 4A). Appelée toutes les quelques minutes :
// pour chaque utilisateur abonné, lit ses réglages et ses données, calcule les notifications dues
// (plan.ts), dédoublonne par (utilisateur, type, clé) et envoie via Web Push.

import webpush from "web-push";
import { prisma } from "../prisma";
import { isLang, DEFAULT_LANG } from "../i18n/lang";
import { effectiveWeekCycle } from "../week-overrides";
import { WEEK_DAYS } from "../week-cycle";
import { SLUG_TO_SPORT_LABEL } from "../ecm-programs";
import { mondayOf } from "../week";
import { addDays, localParts } from "./time";
import type { Profile, PushSubscription } from "@prisma/client";
import { planNotifications, withinDailyCap, type NotifContext, type NotifPrefs, type Planned } from "./plan";
import { makeT } from "../i18n";

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://el-coach-gamma.vercel.app", pub, priv);
  configured = true;
  return true;
}

export type RunReport = { users: number; sent: number; skipped: number; removed: number; failed: number };

/** Utilisateurs traités en parallèle : un échec chez l'un ne bloque jamais les autres. */
const BATCH_SIZE = 20;
/** Un envoi qui a échoué sur tous les appareils est retenté aux passages suivants, jusqu'à ce nombre d'essais. */
const MAX_ATTEMPTS = 3;
/** Un envoi « en cours » depuis plus longtemps que ça est considéré comme interrompu. */
const PENDING_STALE_MS = 10 * 60_000;

type Sub = Pick<PushSubscription, "id" | "endpoint" | "p256dh" | "auth">;

async function deliver(subs: Sub[], n: Pick<Planned, "title" | "body" | "url"> & { tag: string }): Promise<{ okIds: string[]; gone: string[]; errors: string[] }> {
  const payload = JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.tag });
  const okIds: string[] = [];
  const gone: string[] = [];
  const errors: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 30 });
        okIds.push(s.id);
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // 404 / 410 : abonnement expiré ou révoqué côté service push -> supprimé.
        if (code === 404 || code === 410) gone.push(s.id);
        else errors.push(`${code ?? "?"} ${(err as Error).message}`.slice(0, 200));
      }
    }),
  );
  return { okIds, gone, errors };
}

async function startsTodayMinutes(userId: string, tz: string, dateKey: string, now: Date): Promise<number[]> {
  const since = new Date(now.getTime() - 36 * 3_600_000);
  const rows = await prisma.sessionStart.findMany({ where: { userId, startedAt: { gte: since } }, select: { startedAt: true } });
  return rows.map((r) => localParts(r.startedAt, tz)).filter((l) => l.dateKey === dateKey).map((l) => l.minutes);
}

async function buildContext(p: Profile, prefs: NotifPrefs, tz: string, dateKey: string, now: Date): Promise<NotifContext> {
  const ctx: NotifContext = { checkinDone: false, slots: [], startsToday: [], injury: null, week: { count: 0, totalSec: 0, best: null } };

  if (prefs.checkinOn) {
    ctx.checkinDone = !!(await prisma.checkin.findUnique({ where: { userId_date: { userId: p.userId, date: dateKey } }, select: { id: true } }));
  }
  if (prefs.seanceOn) {
    const cycle = (await effectiveWeekCycle(p.userId, p.weekCycle, dateKey)) as Record<string, { repos?: boolean; slots?: { sport: string; heure: string }[] }> | null;
    const [y, m, d] = dateKey.split("-").map(Number);
    const day = cycle?.[WEEK_DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7]];
    ctx.slots = day && !day.repos ? (day.slots ?? []).filter((s) => s.sport && s.heure) : [];
    if (ctx.slots.length) ctx.startsToday = await startsTodayMinutes(p.userId, tz, dateKey, now);
  }
  if (prefs.blessureOn) {
    const rows = await prisma.checkin.findMany({
      where: { userId: p.userId },
      select: { date: true, douleur: true, douleurDetail: true },
      orderBy: { date: "desc" },
      take: 30,
    });
    const latest = rows[0];
    if (latest?.douleur && latest.douleurDetail?.trim()) {
      // Période active : check-ins consécutifs avec douleur signalée (trou de plus de 3 jours = nouvelle période).
      let start = latest.date;
      let prev = latest.date;
      for (const r of rows.slice(1)) {
        if (!r.douleur) break;
        if ((Date.parse(prev) - Date.parse(r.date)) / 86_400_000 > 3) break;
        start = r.date;
        prev = r.date;
      }
      ctx.injury = { zone: latest.douleurDetail.trim().replace(/\s+/g, " "), startKey: start, lastKey: latest.date };
    }
  }
  if (prefs.recapOn && localParts(now, tz).weekday === 0) {
    const from = mondayOf(dateKey);
    const sessions = await prisma.session.findMany({ where: { userId: p.userId, completed: true, date: { gte: from, lte: addDays(dateKey, 0) } } });
    let best: { name: string; pct: number; score: number } | null = null;
    for (const s of sessions) {
      const pct = s.completionRate != null ? Math.round(s.completionRate * 100) : null;
      const slug = (s.data as { programSlug?: string } | null)?.programSlug;
      const label = slug ? SLUG_TO_SPORT_LABEL[slug] : undefined;
      if (pct != null && label && (!best || pct > best.pct || (pct === best.pct && (s.durationSec ?? 0) > best.score))) {
        best = { name: label.replace(/^[^\p{L}\p{N}]+/u, "").trim(), pct, score: s.durationSec ?? 0 };
      }
    }
    ctx.week = {
      count: sessions.length,
      totalSec: sessions.reduce((a, s) => a + (s.durationSec ?? 0), 0),
      best: best ? { name: best.name, pct: best.pct } : null,
    };
  }
  return ctx;
}

async function processUser(p: Profile & { pushSubscriptions: PushSubscription[] }, now: Date, report: RunReport): Promise<void> {
  const tz = p.timezone || "Europe/Paris";
  const lang = isLang(p.langue) ? p.langue : DEFAULT_LANG;
  const { dateKey } = localParts(now, tz);
  const prefs: NotifPrefs = {
    checkinOn: p.notifCheckinOn,
    checkinTime: p.notifCheckinTime,
    checkinPrev: p.notifCheckinTimePrev,
    checkinFrom: p.notifCheckinTimeFrom,
    seanceOn: p.notifSeance,
    blessureOn: p.notifBlessure,
    recapOn: p.notifRecap,
    recapTime: p.notifRecapTime,
  };
  const ctx = await buildContext(p, prefs, tz, dateKey, now);
  const planned = planNotifications({ lang, tz, prefs, ctx, now });
  if (!planned.length) return;

  // Déjà envoyée : ignorée. Un échec complet précédent (ou un envoi resté « en cours » trop longtemps)
  // est retenté jusqu'à MAX_ATTEMPTS.
  const existing = await prisma.notificationLog.findMany({ where: { userId: p.userId, OR: planned.map((n) => ({ kind: n.kind, key: n.key })) } });
  const logOf = (n: Planned) => existing.find((e) => e.kind === n.kind && e.key === n.key);
  const retryable = (e: (typeof existing)[number]) =>
    e.attempts < MAX_ATTEMPTS && (e.result === "echec" || (e.result === "pending" && now.getTime() - e.sentAt.getTime() > PENDING_STALE_MS));
  const todo = planned.filter((n) => {
    const e = logOf(n);
    return !e || retryable(e);
  });
  report.skipped += planned.length - todo.length;
  if (!todo.length) return;

  const sentToday = await prisma.notificationLog.count({ where: { userId: p.userId, day: dateKey, result: "ok" } });
  const allowed = withinDailyCap(todo, sentToday);
  report.skipped += todo.length - allowed.length;

  for (const n of allowed) {
    const prior = logOf(n);
    // Réservation avant l'envoi : deux passages simultanés ne peuvent pas envoyer deux fois la même notification.
    let claimed = false;
    if (!prior) {
      try {
        await prisma.notificationLog.create({ data: { userId: p.userId, kind: n.kind, key: n.key, day: dateKey, result: "pending", sentAt: now } });
        claimed = true;
      } catch {
        claimed = false; // un autre passage vient de la réserver
      }
    } else {
      const res = await prisma.notificationLog.updateMany({
        where: { id: prior.id, result: prior.result, attempts: prior.attempts },
        data: { result: "pending", attempts: prior.attempts + 1, sentAt: now },
      });
      claimed = res.count === 1;
    }
    if (!claimed) {
      report.skipped++;
      continue;
    }
    const { okIds, gone, errors } = await deliver(p.pushSubscriptions, { ...n, tag: `${n.kind}:${n.key}` });
    if (gone.length) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
      report.removed += gone.length;
    }
    if (okIds.length) await prisma.pushSubscription.updateMany({ where: { id: { in: okIds } }, data: { lastUsedAt: now } });
    const detail = okIds.length ? `${okIds.length} appareil(s)` : (errors.join(" | ") || (gone.length ? "abonnement(s) expiré(s) supprimé(s)" : "aucun appareil")).slice(0, 400);
    await prisma.notificationLog.update({
      where: { userId_kind_key: { userId: p.userId, kind: n.kind, key: n.key } },
      data: { result: okIds.length ? "ok" : "echec", detail, sentAt: now },
    });
    if (okIds.length) report.sent++;
    else report.failed++;
  }
}

export async function runNotifications(now = new Date()): Promise<RunReport> {
  const report: RunReport = { users: 0, sent: 0, skipped: 0, removed: 0, failed: 0 };
  if (!configure()) {
    console.error("Notifications : clés VAPID absentes.");
    return report;
  }
  const profiles = await prisma.profile.findMany({
    where: {
      pushSubscriptions: { some: {} },
      OR: [{ notifCheckinOn: true }, { notifSeance: true }, { notifBlessure: true }, { notifRecap: true }],
    },
    include: { pushSubscriptions: true },
  });
  report.users = profiles.length;

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((p) => processUser(p, now, report)));
    // Un échec sur un utilisateur est écrit dans le journal et n'arrête pas les suivants.
    await Promise.all(
      results.map(async (r, k) => {
        if (r.status !== "rejected") return;
        report.failed++;
        console.error("Notifications : utilisateur en échec", batch[k].userId, r.reason);
        try {
          await prisma.notificationLog.create({
            data: { userId: batch[k].userId, kind: "erreur", key: now.toISOString(), day: localParts(now, batch[k].timezone || "Europe/Paris").dateKey, result: "echec", detail: String((r.reason as Error)?.message ?? r.reason).slice(0, 400) },
          });
        } catch {
          /* le journal lui-même est indisponible : l'erreur est déjà dans les logs du serveur */
        }
      }),
    );
  }
  return report;
}

/** Notification de test envoyée à l'appareil qui la demande (point de terminaison de son abonnement). */
export async function sendTestNotification(userId: string, endpoint: string): Promise<{ ok: boolean; reason?: "no-subscription" | "not-configured" | "failed" }> {
  if (!configure()) return { ok: false, reason: "not-configured" };
  const sub = await prisma.pushSubscription.findFirst({ where: { userId, endpoint } });
  if (!sub) return { ok: false, reason: "no-subscription" };
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { langue: true, timezone: true } });
  const lang = isLang(profile?.langue) ? profile!.langue : DEFAULT_LANG;
  const t = makeT(lang);
  const now = new Date();
  const { okIds, gone, errors } = await deliver([sub], { title: t("notif.title.test"), body: t("notif.test"), url: "/settings", tag: "test" });
  if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  if (okIds.length) await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastUsedAt: now } });
  await prisma.notificationLog.create({
    data: { userId, kind: "test", key: now.toISOString(), day: localParts(now, profile?.timezone || "Europe/Paris").dateKey, result: okIds.length ? "test" : "echec", detail: okIds.length ? "ok" : errors.join(" | ").slice(0, 400) || "abonnement expiré" },
  });
  return okIds.length ? { ok: true } : { ok: false, reason: gone.length ? "no-subscription" : "failed" };
}
