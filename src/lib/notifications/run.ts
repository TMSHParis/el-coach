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
import { planNotifications, type NotifContext, type NotifPrefs, type Planned } from "./plan";

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

export type RunReport = { users: number; sent: number; skipped: number; removed: number };

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

async function deliver(subs: Sub[], n: Planned): Promise<{ ok: number; gone: string[] }> {
  const payload = JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: `${n.kind}:${n.key}` });
  let ok = 0;
  const gone: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 30 });
        ok++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id);
        else console.error("web-push a échoué", code, (err as Error).message);
      }
    }),
  );
  return { ok, gone };
}

export async function runNotifications(now = new Date()): Promise<RunReport> {
  const report: RunReport = { users: 0, sent: 0, skipped: 0, removed: 0 };
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

  for (const p of profiles) {
    report.users++;
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

    const ctx: NotifContext = { checkinDone: false, slots: [], injury: null, week: { count: 0, totalSec: 0, best: null } };

    if (prefs.checkinOn) {
      ctx.checkinDone = !!(await prisma.checkin.findUnique({ where: { userId_date: { userId: p.userId, date: dateKey } }, select: { id: true } }));
    }
    if (prefs.seanceOn) {
      const cycle = (await effectiveWeekCycle(p.userId, p.weekCycle, dateKey)) as Record<string, { repos?: boolean; slots?: { sport: string; heure: string }[] }> | null;
      const [y, m, d] = dateKey.split("-").map(Number);
      const day = cycle?.[WEEK_DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7]];
      ctx.slots = day && !day.repos ? (day.slots ?? []).filter((s) => s.sport && s.heure) : [];
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

    for (const n of planNotifications({ lang, tz, prefs, ctx, now })) {
      try {
        await prisma.notificationLog.create({ data: { userId: p.userId, kind: n.kind, key: n.key } });
      } catch {
        report.skipped++; // déjà envoyée pour ce jour / ce créneau / cette période
        continue;
      }
      const { ok, gone } = await deliver(p.pushSubscriptions, n);
      if (gone.length) {
        await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
        report.removed += gone.length;
      }
      if (ok > 0) report.sent++;
      else await prisma.notificationLog.deleteMany({ where: { userId: p.userId, kind: n.kind, key: n.key } }); // réessai au prochain passage
    }
  }
  return report;
}
