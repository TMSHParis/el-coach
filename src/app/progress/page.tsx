import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/date-key";
import { BackHomeButton } from "@/components/back-home-button";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import type { EcmScore } from "@/lib/coaching-adaptatif-mock";
import { ProgressCharts, type WeightPoint, type ScorePoint } from "./progress-charts";
import { feelingBadge } from "@/lib/session-feeling";

export const metadata = { title: "Ma progression — EL COACH METHOD" };

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

const VOLUME_FOCUS_LABELS: Record<string, string> = { upper: "Upper", lower: "Lower", full: "Full" };

/** Titres de section — même traitement que le dashboard (Bebas + trait d'accent). */
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-bebas, sans-serif)",
  fontSize: 22,
  lineHeight: 1,
  letterSpacing: 4,
  textTransform: "uppercase",
  color: "#fff",
  margin: "8px 0 14px",
  paddingBottom: 8,
  borderBottom: "2px solid #E8FF00",
};

/** Nombre de séances et meilleure charge par focus Volume Block. */
function buildVolumeStats(
  checkins: { date: string; volumeBlockFocus: string | null }[],
  sessions: { date: string; bestResult: unknown }[],
): { focus: string; label: string; seances: number; meilleureCharge: number | null }[] {
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

export default async function ProgressPage() {
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
  const [checkins30, outputs30, allCheckinDates, sessionsCompleted, checkinsTotal] = await Promise.all([
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
    prisma.checkin.findMany({ where: { userId }, select: { date: true }, orderBy: { date: "asc" } }),
    prisma.session.count({ where: { userId, completed: true } }),
    prisma.checkin.count({ where: { userId } }),
  ]);

  // Dernières séances terminées — ressenti, calories et photos du compte rendu.
  const recentSessions = await prisma.session.findMany({
    where: { userId, completed: true },
    select: { date: true, sessionFeeling: true, sessionNote: true, caloriesBrulees: true, photos: true },
    orderBy: { date: "desc" },
    take: 8,
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

  const weightData: WeightPoint[] = checkins30
    .filter((c) => c.poids && Number(c.poids) > 0)
    .map((c) => ({ date: c.date, kg: Number(c.poids) }));

  const scoreData: ScorePoint[] = outputs30
    .map((o) => {
      const ecm = (o.output as { ecm?: EcmScore } | null)?.ecm;
      return ecm ? { date: o.date, score: ecm.numeric } : null;
    })
    .filter((p): p is ScorePoint => p !== null);

  const { current, best } = computeStreaks(allCheckinDates.map((c) => c.date));

  return (
    <div className={ecmFontVariables} style={{ background: "#080808", minHeight: "100vh", color: "#e0e0e0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 0" }}>
        <BackHomeButton />
        <div style={{ fontFamily: "var(--font-bebas, sans-serif)", fontSize: 28, letterSpacing: 3, color: "#fff" }}>
          Ma progression
        </div>
      </div>

      <ProgressCharts
        weightData={weightData}
        scoreData={scoreData}
        stats={{ checkinsTotal, sessionsCompleted, currentStreak: current, bestStreak: best }}
      />

      {recentSessions.length > 0 && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 32px" }}>
          <div style={sectionTitleStyle}>Dernières séances</div>
          {recentSessions.map((s) => {
            const badge = feelingBadge(s.sessionFeeling);
            return (
              <div
                key={s.date}
                style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{s.date}</span>
                  <span style={{ fontSize: 12, color: "#E8FF00" }}>
                    {[badge, s.caloriesBrulees ? `🔥 ${s.caloriesBrulees} kcal` : null].filter(Boolean).join(" · ") || "—"}
                  </span>
                </div>
                {s.sessionNote && (
                  <div style={{ fontSize: 12, color: "#8a8a8a", marginTop: 6, lineHeight: 1.5 }}>{s.sessionNote}</div>
                )}
                {s.photos.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {s.photos.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt={`Séance du ${s.date}`}
                        style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 6 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {volumeStats.some((v) => v.seances > 0) && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
          <div style={sectionTitleStyle}>Volume Block par focus</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {volumeStats.map((v) => (
              <div
                key={v.focus}
                style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 4, padding: "12px 10px" }}
              >
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#8a8a8a" }}>
                  {v.label}
                </div>
                <div style={{ fontFamily: "var(--font-bebas, sans-serif)", fontSize: 26, color: "#fff", lineHeight: 1.2 }}>
                  {v.seances}
                </div>
                <div style={{ fontSize: 10, color: "#8a8a8a" }}>séance{v.seances > 1 ? "s" : ""}</div>
                <div style={{ fontSize: 11, color: "#E8FF00", marginTop: 6 }}>
                  {v.meilleureCharge ? `${v.meilleureCharge} kg max` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
