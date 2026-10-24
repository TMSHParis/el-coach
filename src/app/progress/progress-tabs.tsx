"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChartCard, TimelineChart, TimelineLegend, type TimelineDay } from "./progress-charts";
import { useLang, useT } from "@/lib/i18n/provider";
import { formatNumber, type DictKey } from "@/lib/i18n";
import styles from "./progress.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type SessionCard = {
  date: string;
  dateLabel: string;
  typeLabel: string;
  feelingLabel: string | null;
  note: string | null;
  durationSec: number | null;
  calories: number | null;
  bpmMoyen: number | null;
  heartRateZones: { zone: number; minutes: number }[] | null;
};

export type ProgramCard = { label: string; seances: number; dernierWod: string | null; dernierWodDate: string | null };
export type VolumeStat = { focus: string; label: string; seances: number; meilleureCharge: number | null };
export type Badge = { threshold: number; icon: string; label: string; unlocked: boolean; current: boolean };
export type WeekRow = { label: string; sub: string; status: "ok" | "partial" };

const TABS = [
  { key: "overview", label: "app.progress.tab.overview" },
  { key: "sessions", label: "app.progress.tab.sessions" },
  { key: "programs", label: "app.progress.tab.programs" },
  { key: "streak", label: "app.progress.tab.streak" },
] as const satisfies readonly { key: string; label: DictKey }[];
type TabKey = (typeof TABS)[number]["key"];

const ZONE_COLORS: Record<number, string> = { 1: "var(--c-5b7590)", 2: "var(--c-5fa97e)", 3: "var(--c-c9a84c)", 4: "var(--c-e07b39)", 5: "var(--c-c9605a)" };
const VOLUME_ICONS: Record<string, string> = { upper: "💪", lower: "🦵", full: "🔄" };

function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

function ZoneBreakdown({ zones }: { zones: { zone: number; minutes: number }[] }) {
  const t = useT();
  const total = zones.reduce((s, z) => s + z.minutes, 0);
  if (total <= 0) return null;
  return (
    <div>
      <div className={styles.zoneRow}>
        {zones
          .slice()
          .sort((a, b) => a.zone - b.zone)
          .map((z) => (
            <div
              key={z.zone}
              className={styles.zoneSeg}
              style={{ width: `${(z.minutes / total) * 100}%`, background: ZONE_COLORS[z.zone] ?? "var(--c-555555)" }}
            />
          ))}
      </div>
      <div className={styles.zoneLegend}>
        {zones
          .slice()
          .sort((a, b) => a.zone - b.zone)
          .map((z) => (
            <span key={z.zone}>
              <i style={{ background: ZONE_COLORS[z.zone] ?? "var(--c-555555)" }} />
              {t("app.progress.zone", { n: z.zone, min: Math.round(z.minutes) })}
            </span>
          ))}
      </div>
    </div>
  );
}

function SessionAccordionCard({ session, defaultOpen }: { session: SessionCard; defaultOpen: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);
  const hasDetail = session.durationSec || session.calories || session.bpmMoyen;
  return (
    <div className={styles.sessCard}>
      <button type="button" className={styles.sessHead} onClick={() => setOpen((o) => !o)}>
        <div>
          <div className={styles.sessDate}>{session.dateLabel}</div>
          <div className={styles.sessType}>{session.typeLabel}</div>
        </div>
        <span className={styles.sessMood}>
          {session.feelingLabel ?? "—"} <i className={cx(styles.chev, open && styles.open)}>▾</i>
        </span>
      </button>
      {open && (
        <div className={styles.sessBody}>
          {session.note && <p className={styles.sessNote}>&quot;{session.note}&quot;</p>}
          {hasDetail && (
            <div className={styles.sessDetail}>
              {session.durationSec != null && (
                <div className={styles.mini}>
                  <b>{fmtDuration(session.durationSec)}</b>
                  <span>{t("app.progress.duration")}</span>
                </div>
              )}
              {session.calories != null && (
                <div className={styles.mini}>
                  <b>{session.calories}</b>
                  <span>{t("app.progress.kcal")}</span>
                </div>
              )}
              {session.bpmMoyen != null && (
                <div className={styles.mini}>
                  <b>{session.bpmMoyen}</b>
                  <span>{t("app.progress.avgBpm")}</span>
                </div>
              )}
            </div>
          )}
          {session.heartRateZones && session.heartRateZones.length > 0 && <ZoneBreakdown zones={session.heartRateZones} />}
        </div>
      )}
    </div>
  );
}

export function ProgressTabs({
  defaultTab,
  expandDate,
  weightData,
  scoreData,
  stats,
  sessions,
  sessionsHasMore,
  sessionsMoreHref,
  programs,
  volumeStats,
  timeline,
  streak,
  badges,
  weeks,
}: {
  defaultTab: TabKey;
  expandDate?: string | null;
  weightData: { date: string; value: number }[];
  scoreData: { date: string; value: number }[];
  stats: { checkinsTotal: number; sessionsCompleted: number; currentStreak: number; bestStreak: number };
  sessions: SessionCard[];
  sessionsHasMore: boolean;
  sessionsMoreHref: string;
  programs: ProgramCard[];
  volumeStats: VolumeStat[];
  timeline: TimelineDay[];
  streak: { current: number; best: number; nextThreshold: number | null };
  badges: Badge[];
  weeks: WeekRow[];
}) {
  const t = useT();
  const { lang } = useLang();
  const [tab, setTab] = useState<TabKey>(defaultTab);
  const [celebrate, setCelebrate] = useState<Badge | null>(null);

  useEffect(() => {
    const justHit = badges.find((b) => b.unlocked && b.threshold === streak.best);
    if (!justHit) return;
    try {
      const key = `elc_celeb_${justHit.threshold}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const showId = setTimeout(() => setCelebrate(justHit), 0);
      const hideId = setTimeout(() => setCelebrate(null), 4000);
      return () => {
        clearTimeout(showId);
        clearTimeout(hideId);
      };
    } catch {
      // sessionStorage indisponible — pas de toast, pas bloquant.
    }
  }, [badges, streak.best]);

  return (
    <div>
      <div className={styles.tabs}>
        {TABS.map((tb) => (
          <button key={tb.key} type="button" className={cx(styles.tab, tab === tb.key && styles.active)} onClick={() => setTab(tb.key)}>
            <span className={styles.tabLabel}>{t(tb.label)}</span>
          </button>
        ))}
      </div>

      <div className={styles.fw}>
        {tab === "overview" && (
          <div className={styles.panel}>
            <div className={styles.sl}>{t("app.progress.weightEvolution")}</div>
            <LineChartCard title={t("app.progress.currentWeight")} data={weightData} dataKey="weight" unit=" kg" betterWhenDown />

            <div className={styles.sl}>{t("app.progress.eqmScore")}</div>
            <LineChartCard title={t("app.progress.avgScore")} data={scoreData} dataKey="score" unit="" betterWhenDown={false} />

            <div className={styles.sl}>{t("app.progress.summary")}</div>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <b>{stats.checkinsTotal}</b>
                <span>{t("app.progress.checkins")}</span>
              </div>
              <div className={styles.stat}>
                <b>{stats.sessionsCompleted}</b>
                <span>{t("app.progress.workouts")}</span>
              </div>
              <div className={cx(styles.stat, styles.statStreak)}>
                <span className={styles.statStreakFire}>🔥</span>
                <b>{stats.currentStreak}</b>
                <span>{t("app.progress.streak")}</span>
              </div>
              <div className={styles.stat}>
                <b>{stats.bestStreak}</b>
                <span>{t("app.progress.record")}</span>
              </div>
            </div>
          </div>
        )}

        {tab === "sessions" && (
          <div className={styles.panel}>
            <div className={styles.sl}>{t("app.progress.lastWorkouts")}</div>
            {sessions.length === 0 ? (
              <div className={styles.emptyChart}>{t("app.progress.noWorkout")}</div>
            ) : (
              sessions.map((s) => <SessionAccordionCard key={s.date} session={s} defaultOpen={s.date === expandDate} />)
            )}
            {sessionsHasMore && (
              <Link href={sessionsMoreHref} className={styles.moreBtn}>
                {t("app.progress.more")}
              </Link>
            )}
          </div>
        )}

        {tab === "programs" && (
          <div className={styles.panel}>
            <div className={styles.sl}>{t("app.progress.activePrograms")}</div>
            {programs.length === 0 ? (
              <div className={styles.emptyChart}>{t("app.progress.noProgram")}</div>
            ) : (
              programs.map((p) => (
                <div key={p.label} className={styles.progCard}>
                  <div className={styles.pn}>{p.label}</div>
                  <div className={styles.ps}>
                    {t(p.seances > 1 ? "app.progress.sessionCount.many" : "app.progress.sessionCount.one", { n: p.seances })}
                    {p.dernierWod ? `${t("app.progress.lastWod", { wod: p.dernierWod })}${p.dernierWodDate ? ` (${p.dernierWodDate})` : ""}` : ""}
                  </div>
                </div>
              ))
            )}

            {volumeStats.some((v) => v.seances > 0) && (
              <>
                <div className={styles.sl}>{t("app.progress.volumeByFocus")}</div>
                <div className={styles.volumeList}>
                  {volumeStats.map((v) => {
                    const max = Math.max(1, ...volumeStats.map((x) => x.seances));
                    return (
                      <div key={v.focus} className={styles.volumeRow}>
                        <span className={styles.volumeIcon}>{VOLUME_ICONS[v.focus] ?? "🏋️"}</span>
                        <div className={styles.volumeMain}>
                          <div className={styles.volumeTop}>
                            <span className={styles.volumeLabel}>{v.label}</span>
                            <span className={styles.volumeCount}>{v.seances}</span>
                          </div>
                          <div className={styles.volumeTrack}>
                            <div className={styles.volumeFill} style={{ width: `${(v.seances / max) * 100}%` }} />
                          </div>
                          {v.meilleureCharge && <div className={styles.volumeBest}>{t("app.progress.bestResult", { n: formatNumber(lang, v.meilleureCharge) })}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "streak" && (
          <div className={styles.panel}>
            <div className={styles.sl}>{t("app.progress.regularity")}</div>
            <div className={styles.streakCard}>
              <div className={styles.streakFire}>🔥</div>
              <div className={styles.streakNum}>{streak.current}</div>
              <div className={styles.streakLbl}>{t("app.progress.consecutiveDays")}</div>
              <div className={styles.streakTiles}>
                <div className={cx(styles.streakTile, styles.streakTileHighlight)}>
                  <b>{streak.best}</b>
                  <span>{t("app.progress.currentRecord")}</span>
                </div>
                <div className={styles.streakTile}>
                  <b>{streak.nextThreshold ?? "—"}</b>
                  <span>{t("app.progress.nextMilestone")}</span>
                </div>
                <div className={styles.streakTile}>
                  <b>{streak.nextThreshold ? `${Math.min(100, Math.round((streak.current / streak.nextThreshold) * 100))}%` : "—"}</b>
                  <span>{t("app.progress.progression")}</span>
                </div>
              </div>
            </div>

            <div className={styles.sl}>{t("app.progress.last30")}</div>
            <div className={styles.timelineCard}>
              <TimelineLegend />
              <TimelineChart data={timeline} />
            </div>

            <div className={styles.sl}>{t("app.progress.milestones")}</div>
            <div className={styles.badgeRow}>
              {badges.map((b) => (
                <div key={b.threshold} className={cx(styles.badge, b.unlocked && styles.unlocked, b.current && styles.current)}>
                  <span className={styles.badgeCheck}>✓</span>
                  <div className={styles.badgeIcon}>{b.icon}</div>
                  <div className={styles.bn}>{b.threshold}</div>
                  <div className={styles.bl}>{t("app.progress.daysUnit")}</div>
                  {b.current && streak.nextThreshold && (
                    <div className={styles.badgeProgressTrack}>
                      <div
                        className={styles.badgeProgressFill}
                        style={{ width: `${Math.min(100, (streak.current / streak.nextThreshold) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {streak.nextThreshold && (
              <div className={styles.nextMilestone}>
                <div className={styles.nmHead}>
                  <span>{t("app.progress.nextMilestoneDays", { n: streak.nextThreshold })}</span>
                  <span>
                    {streak.current} / {streak.nextThreshold}
                  </span>
                </div>
                <div className={styles.nmTrack}>
                  <div className={styles.nmFill} style={{ width: `${Math.min(100, (streak.current / streak.nextThreshold) * 100)}%` }} />
                </div>
              </div>
            )}

            <div className={styles.sl}>{t("app.progress.weeksHistory")}</div>
            <div className={styles.card} style={{ padding: "4px 16px" }}>
              {weeks.length === 0 ? (
                <div className={styles.emptyChart}>{t("app.progress.noHistory")}</div>
              ) : (
                weeks.map((w) => (
                  <div key={w.label} className={styles.weekRow}>
                    <div>
                      <div className={styles.weekLbl}>{w.label}</div>
                      <div className={styles.weekSub}>{w.sub}</div>
                    </div>
                    <span className={cx(styles.weekBadge, w.status === "ok" ? styles.ok : styles.partial)}>
                      {w.status === "ok" ? t("app.progress.weekSuccess") : t("app.progress.weekPartial")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {celebrate && (
        <div className={styles.celebToast}>
          {celebrate.icon} {t("app.progress.milestoneUnlocked", { n: celebrate.threshold })}
        </div>
      )}
    </div>
  );
}
