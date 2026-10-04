import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/date-key";
import { BackHomeButton } from "@/components/back-home-button";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import type { EcmScore } from "@/lib/coaching-adaptatif-mock";
import type { Day } from "@/lib/programming";
import Link from "next/link";
import { isRestLikeSeance } from "@/lib/seance-kinds";
import { feelingBadge } from "@/lib/session-feeling";
import type { SessionBlocResult } from "../session/actions";
import { MovementChart, type TimelineDay } from "./progress-charts";
import { ProgressTabs, type SessionCard, type ProgramCard, type VolumeStat, type Badge, type WeekRow } from "./progress-tabs";
import styles from "./progress.module.css";

export const metadata = { title: "Ma progression — EL COACH METHOD" };

const SESSIONS_PAGE_SIZE = 10;
const BADGE_THRESHOLDS = [
  { threshold: 7, icon: "🥉" },
  { threshold: 30, icon: "🥈" },
  { threshold: 100, icon: "🥇" },
  { threshold: 365, icon: "🏆" },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

/** Jours consécutifs (calendaires) se terminant au dernier check-in — courant + record. */
function computeStreaks(sortedDates: string[]): { current: number; best: number } {
  if (sortedDates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const cur = new Date(sortedDates[i]);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const today = dateKey(new Date());
  const yesterday = daysAgo(1);
  const last = sortedDates[sortedDates.length - 1];
  if (last !== today && last !== yesterday) return { current: 0, best };

  let current = 1;
  for (let i = sortedDates.length - 1; i > 0; i--) {
    const prev = new Date(sortedDates[i - 1]);
    const cur = new Date(sortedDates[i]);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) current++;
    else break;
  }
  return { current, best };
}

function buildBadges(best: number): { badges: Badge[]; nextThreshold: number | null } {
  const nextThreshold = BADGE_THRESHOLDS.find((b) => best < b.threshold)?.threshold ?? null;
  const badges: Badge[] = BADGE_THRESHOLDS.map((b) => ({
    threshold: b.threshold,
    icon: b.icon,
    label: `${b.threshold} jours`,
    unlocked: best >= b.threshold,
    current: b.threshold === nextThreshold,
  }));
  return { badges, nextThreshold };
}

/** Lundi de la semaine calendaire contenant `d`. */
function mondayOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  const r = new Date(d);
  r.setDate(d.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Historique des 4 dernières semaines pleinement écoulées — seuil 6 check-ins/7 (doc F.5.d). */
function buildWeeks(checkinDates: string[]): WeekRow[] {
  const thisMonday = mondayOf(new Date());
  const weeks: WeekRow[] = [];
  for (let w = 1; w <= 4; w++) {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - w * 7);
    const count = checkinDates.filter((d) => {
      const diff = Math.round((new Date(d).getTime() - start.getTime()) / 86_400_000);
      return diff >= 0 && diff < 7;
    }).length;
    weeks.push({
      label: `Semaine du ${new Date(start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
      sub: `${count} check-in${count > 1 ? "s" : ""} sur 7`,
      status: count >= 6 ? "ok" : "partial",
    });
  }
  return weeks.reverse();
}

/** Timeline 30 jours — classification par jour (doc F.5.b). */
function buildTimeline(checkinsByDate: Map<string, string | null>): TimelineDay[] {
  const today = dateKey(new Date());
  const out: TimelineDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = daysAgo(i);
    const seance = checkinsByDate.get(date);
    const status: TimelineDay["status"] =
      date > today ? "future" : seance !== undefined ? (isRestLikeSeance(seance) ? "rest" : "done") : "miss";
    out.push({ date, status });
  }
  return out;
}

const VOLUME_FOCUS_LABELS: Record<string, string> = { upper: "Upper", lower: "Lower", full: "Full" };

/** Nombre de séances et meilleure charge par focus Volume Block. */
function buildVolumeStats(
  checkins: { date: string; volumeBlockFocus: string | null }[],
  sessions: { date: string; bestResult: unknown }[],
): VolumeStat[] {
  const byDate = new Map(sessions.map((s) => [s.date, s.bestResult as { charge?: number } | null]));
  return Object.entries(VOLUME_FOCUS_LABELS).map(([focus, label]) => {
    const dates = checkins.filter((c) => c.volumeBlockFocus === focus).map((c) => c.date);
    const charges = dates
      .map((d) => byDate.get(d)?.charge)
      .filter((c): c is number => typeof c === "number" && c > 0);
    return {
      focus,
      label,
      seances: dates.filter((d) => byDate.has(d)).length,
      meilleureCharge: charges.length ? Math.max(...charges) : null,
    };
  });
}

/** Meilleure charge par date pour un mouvement précis (nom exact tel qu'enregistré sur /session). */
function buildMovementHistory(sessions: { date: string; data: unknown }[], movement: string) {
  return sessions
    .map((s) => {
      const blocs = (s.data as { blocs?: SessionBlocResult[] } | null)?.blocs ?? [];
      const bloc = blocs.find((b) => b.nom === movement);
      const top = (bloc?.series ?? [])
        .map((se) => parseFloat(se.charge))
        .filter((c) => Number.isFinite(c) && c > 0)
        .sort((a, b) => b - a)[0];
      return top !== undefined ? { date: s.date, charge: top } : null;
    })
    .filter((p): p is { date: string; charge: number } => p !== null);
}

function sessionTypeLabel(seance: string | null): string {
  if (!seance) return "Séance";
  return seance.replace(/^[^\p{L}\p{N}]+/u, "").trim() || seance;
}

function sessionDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ movement?: string; tab?: string; date?: string; sessionsLimit?: string }>;
}) {
  const { movement, tab, date: expandDate, sessionsLimit } = await searchParams;
  const userId = await getUserId();
  if (!userId) {
    return (
      <section className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="label">[ PROGRESSION ]</div>
        <h1 className="mt-4 text-3xl font-semibold">Connecte-toi pour voir ta progression.</h1>
      </section>
    );
  }

  const since30 = daysAgo(30);
  const limit = Math.min(200, Math.max(SESSIONS_PAGE_SIZE, Number(sessionsLimit) || SESSIONS_PAGE_SIZE));

  const [profile, checkins30, outputs30, allCheckins, sessionsCompleted, checkinsTotal] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { programme: true, programmes: true } }),
    prisma.checkin.findMany({
      where: { userId, date: { gte: since30 }, poids: { not: null } },
      select: { date: true, poids: true },
      orderBy: { date: "asc" },
    }),
    prisma.dashboardOutput.findMany({
      where: { userId, date: { gte: since30 } },
      select: { date: true, output: true },
      orderBy: { date: "asc" },
    }),
    // Toutes les séances (date + seance) : streaks, timeline, historique de semaines, programmes.
    prisma.checkin.findMany({ where: { userId }, select: { date: true, seance: true }, orderBy: { date: "asc" } }),
    prisma.session.count({ where: { userId, completed: true } }),
    prisma.checkin.count({ where: { userId } }),
  ]);

  const programmes = profile
    ? profile.programmes.length > 0
      ? profile.programmes
      : [profile.programme].filter((p): p is string => Boolean(p))
    : [];

  // Dernières séances terminées (paginées) — ressenti, calories, FC et note.
  const [recentSessionsRaw, sessionsTotalCount] = await Promise.all([
    prisma.session.findMany({
      where: { userId, completed: true },
      select: { date: true, sessionFeeling: true, sessionNote: true, caloriesBrulees: true, durationSec: true, photoAnalysis: true },
      orderBy: { date: "desc" },
      take: limit,
    }),
    prisma.session.count({ where: { userId, completed: true } }),
  ]);
  const sessionDates = recentSessionsRaw.map((s) => s.date);
  const sessionCheckins = sessionDates.length
    ? await prisma.checkin.findMany({ where: { userId, date: { in: sessionDates } }, select: { date: true, seance: true } })
    : [];
  const seanceByDate = new Map(sessionCheckins.map((c) => [c.date, c.seance]));

  const sessions: SessionCard[] = recentSessionsRaw.map((s) => {
    const analysis = s.photoAnalysis as { bpmMoyen?: number | null; heartRateZones?: { zone: number; minutes: number }[] | null } | null;
    return {
      date: s.date,
      dateLabel: sessionDateLabel(s.date),
      typeLabel: sessionTypeLabel(seanceByDate.get(s.date) ?? null),
      feelingLabel: feelingBadge(s.sessionFeeling),
      note: s.sessionNote,
      durationSec: s.durationSec,
      calories: s.caloriesBrulees,
      bpmMoyen: analysis?.bpmMoyen ?? null,
      heartRateZones: analysis?.heartRateZones ?? null,
    };
  });

  // Volume Block : progression suivie séparément pour chaque focus (haut, bas, complet).
  const volumeCheckins = await prisma.checkin.findMany({
    where: { userId, volumeBlockFocus: { not: null } },
    select: { date: true, volumeBlockFocus: true },
    orderBy: { date: "asc" },
  });
  const volumeSessions = volumeCheckins.length
    ? await prisma.session.findMany({
        where: { userId, completed: true, date: { in: volumeCheckins.map((c) => c.date) } },
        select: { date: true, bestResult: true },
      })
    : [];
  const volumeStats = buildVolumeStats(volumeCheckins, volumeSessions);

  // Programmes actifs : séances effectuées + dernier WOD, par programme.
  const programDates = allCheckins.filter((c) => c.seance && programmes.includes(c.seance));
  const programSessions = programDates.length
    ? await prisma.session.findMany({
        where: { userId, completed: true, date: { in: programDates.map((c) => c.date) } },
        select: { date: true },
        orderBy: { date: "desc" },
      })
    : [];
  const completedProgramDates = new Set(programSessions.map((s) => s.date));
  const programs: ProgramCard[] = await Promise.all(
    programmes.map(async (label) => {
      const dates = programDates.filter((c) => c.seance === label && completedProgramDates.has(c.date)).map((c) => c.date);
      const lastDate = dates.sort().at(-1) ?? null;
      let dernierWod: string | null = null;
      if (lastDate) {
        const out = await prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: lastDate } }, select: { output: true } });
        dernierWod = (out?.output as { generatedDay?: Day } | null)?.generatedDay?.focus ?? null;
      }
      return { label, seances: dates.length, dernierWod };
    }),
  );

  const weightData = checkins30
    .filter((c) => c.poids && Number(c.poids) > 0)
    .map((c) => ({ date: c.date, value: Number(c.poids) }));

  const scoreData = outputs30
    .map((o) => {
      const ecm = (o.output as { ecm?: EcmScore } | null)?.ecm;
      return ecm ? { date: o.date, value: ecm.numeric } : null;
    })
    .filter((p): p is { date: string; value: number } => p !== null);

  const { current, best } = computeStreaks(allCheckins.map((c) => c.date));
  const { badges, nextThreshold } = buildBadges(best);
  const weeks = buildWeeks(allCheckins.map((c) => c.date));
  const checkinsByDate = new Map(allCheckins.map((c) => [c.date, c.seance]));
  const timeline = buildTimeline(checkinsByDate);

  const movementData = movement
    ? buildMovementHistory(
        await prisma.session.findMany({
          where: { userId, completed: true },
          select: { date: true, data: true },
          orderBy: { date: "asc" },
          take: 60,
        }),
        movement,
      )
    : null;

  const validTab = tab === "sessions" || tab === "programs" || tab === "streak" ? tab : "overview";

  return (
    <div className={`${ecmFontVariables} ${styles.root}`}>
      <div className={styles.hero}>
        <div style={{ marginBottom: 14 }}>
          <BackHomeButton />
        </div>
        <div className={styles.kickerTop}>Progression</div>
        <div className={styles.title}>MA PROGRESSION</div>
      </div>

      {movement && movementData && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 0" }}>
          <Link href="/progress" style={{ fontSize: 12, color: "#8a8a8a", textDecoration: "none" }}>
            ← Toute la progression
          </Link>
          <div style={{ marginTop: 10 }}>
            <MovementChart movement={movement} data={movementData} />
          </div>
        </div>
      )}

      <ProgressTabs
        defaultTab={validTab}
        expandDate={expandDate}
        weightData={weightData}
        scoreData={scoreData}
        stats={{ checkinsTotal, sessionsCompleted, currentStreak: current, bestStreak: best }}
        sessions={sessions}
        sessionsHasMore={sessions.length < sessionsTotalCount && sessions.length >= limit}
        sessionsMoreHref={`/progress?tab=sessions&sessionsLimit=${limit + SESSIONS_PAGE_SIZE}`}
        programs={programs}
        volumeStats={volumeStats}
        timeline={timeline}
        streak={{ current, best, nextThreshold }}
        badges={badges}
        weeks={weeks}
      />
    </div>
  );
}
