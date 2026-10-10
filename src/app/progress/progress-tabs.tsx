"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChartCard, TimelineChart, TimelineLegend, type TimelineDay } from "./progress-charts";
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

export type ProgramCard = { label: string; seances: number; dernierWod: string | null };
export type VolumeStat = { focus: string; label: string; seances: number; meilleureCharge: number | null };
export type Badge = { threshold: number; icon: string; label: string; unlocked: boolean; current: boolean };
export type WeekRow = { label: string; sub: string; status: "ok" | "partial" };

const TABS = [
  { key: "overview", label: "VUE D'ENSEMBLE" },
  { key: "sessions", label: "SÉANCES" },
  { key: "programs", label: "PROGRAMME" },
  { key: "streak", label: "ASSIDUITÉ" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const ZONE_COLORS: Record<number, string> = { 1: "#5b7590", 2: "#5FA97E", 3: "#C9A84C", 4: "#E07B39", 5: "#C9605A" };

function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

function ZoneBreakdown({ zones }: { zones: { zone: number; minutes: number }[] }) {
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
              style={{ width: `${(z.minutes / total) * 100}%`, background: ZONE_COLORS[z.zone] ?? "#555" }}
            />
          ))}
      </div>
      <div className={styles.zoneLegend}>
        {zones
          .slice()
          .sort((a, b) => a.zone - b.zone)
          .map((z) => (
            <span key={z.zone}>
              <i style={{ background: ZONE_COLORS[z.zone] ?? "#555" }} />
              Zone {z.zone} · {Math.round(z.minutes)} min
            </span>
          ))}
      </div>
    </div>
  );
}

function SessionAccordionCard({ session, defaultOpen }: { session: SessionCard; defaultOpen: boolean }) {
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
                  <span>Durée</span>
                </div>
              )}
              {session.calories != null && (
                <div className={styles.mini}>
                  <b>{session.calories}</b>
                  <span>Kcal</span>
                </div>
              )}
              {session.bpmMoyen != null && (
                <div className={styles.mini}>
                  <b>{session.bpmMoyen}</b>
                  <span>BPM moy.</span>
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
        {TABS.map((t) => (
          <button key={t.key} type="button" className={cx(styles.tab, tab === t.key && styles.active)} onClick={() => setTab(t.key)}>
            <span className={styles.tabLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.fw}>
        {tab === "overview" && (
          <div className={styles.panel}>
            <div className={styles.sl}>Évolution du poids · 30 derniers jours</div>
            <LineChartCard title="Poids actuel" data={weightData} dataKey="weight" unit=" kg" betterWhenDown />

            <div className={styles.sl}>Score ECM · 30 derniers jours</div>
            <LineChartCard title="Score moyen" data={scoreData} dataKey="score" unit="" betterWhenDown={false} />

            <div className={styles.sl}>Résumé</div>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <b>{stats.checkinsTotal}</b>
                <span>Check-ins</span>
              </div>
              <div className={styles.stat}>
                <b>{stats.sessionsCompleted}</b>
                <span>Séances</span>
              </div>
              <div className={styles.stat}>
                <b>{stats.currentStreak}</b>
                <span>Streak</span>
              </div>
              <div className={styles.stat}>
                <b>{stats.bestStreak}</b>
                <span>Record</span>
              </div>
            </div>
          </div>
        )}

        {tab === "sessions" && (
          <div className={styles.panel}>
            <div className={styles.sl}>Dernières séances</div>
            {sessions.length === 0 ? (
              <div className={styles.emptyChart}>Pas encore de séance enregistrée</div>
            ) : (
              sessions.map((s) => <SessionAccordionCard key={s.date} session={s} defaultOpen={s.date === expandDate} />)
            )}
            {sessionsHasMore && (
              <Link href={sessionsMoreHref} className={styles.moreBtn}>
                VOIR PLUS
              </Link>
            )}
          </div>
        )}

        {tab === "programs" && (
          <div className={styles.panel}>
            <div className={styles.sl}>Programmes actifs</div>
            {programs.length === 0 ? (
              <div className={styles.emptyChart}>Aucun programme actif</div>
            ) : (
              programs.map((p) => (
                <div key={p.label} className={styles.progCard}>
                  <div className={styles.pn}>{p.label}</div>
                  <div className={styles.ps}>
                    {p.seances} séance{p.seances > 1 ? "s" : ""}
                    {p.dernierWod ? ` · dernier WOD : ${p.dernierWod}` : ""}
                  </div>
                </div>
              ))
            )}

            {volumeStats.some((v) => v.seances > 0) && (
              <>
                <div className={styles.sl}>Volume Block par focus</div>
                <div className={styles.statGrid} style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  {volumeStats.map((v) => (
                    <div key={v.focus} className={styles.stat}>
                      <b>{v.seances}</b>
                      <span>{v.label}</span>
                      {v.meilleureCharge && <div style={{ fontSize: 10, color: "#C9A84C", marginTop: 4 }}>{v.meilleureCharge} kg</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "streak" && (
          <div className={styles.panel}>
            <div className={styles.sl}>Régularité</div>
            <div className={styles.streakCard}>
              <div className={styles.streakFire}>🔥</div>
              <div className={styles.streakNum}>{streak.current}</div>
              <div className={styles.streakLbl}>Jours consécutifs</div>
              <div className={styles.streakTiles}>
                <div className={cx(styles.streakTile, styles.streakTileHighlight)}>
                  <b>{streak.best}</b>
                  <span>Record actuel</span>
                </div>
                <div className={styles.streakTile}>
                  <b>{streak.nextThreshold ?? "—"}</b>
                  <span>Prochain palier</span>
                </div>
                <div className={styles.streakTile}>
                  <b>{streak.nextThreshold ? `${Math.min(100, Math.round((streak.current / streak.nextThreshold) * 100))}%` : "—"}</b>
                  <span>Progression</span>
                </div>
              </div>
            </div>

            <div className={styles.sl}>30 derniers jours</div>
            <div className={styles.timelineCard}>
              <TimelineLegend />
              <TimelineChart data={timeline} />
            </div>

            <div className={styles.sl}>Paliers</div>
            <div className={styles.badgeRow}>
              {badges.map((b) => (
                <div key={b.threshold} className={cx(styles.badge, b.unlocked && styles.unlocked, b.current && styles.current)}>
                  <span className={styles.badgeCheck}>✓</span>
                  <div className={styles.badgeIcon}>{b.icon}</div>
                  <div className={styles.bn}>{b.threshold}</div>
                  <div className={styles.bl}>jours</div>
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
                  <span>Prochain palier — {streak.nextThreshold} jours</span>
                  <span>
                    {streak.current} / {streak.nextThreshold}
                  </span>
                </div>
                <div className={styles.nmTrack}>
                  <div className={styles.nmFill} style={{ width: `${Math.min(100, (streak.current / streak.nextThreshold) * 100)}%` }} />
                </div>
              </div>
            )}

            <div className={styles.sl}>Historique des semaines</div>
            <div className={styles.card} style={{ padding: "4px 16px" }}>
              {weeks.length === 0 ? (
                <div className={styles.emptyChart}>Pas encore d&apos;historique</div>
              ) : (
                weeks.map((w) => (
                  <div key={w.label} className={styles.weekRow}>
                    <div>
                      <div className={styles.weekLbl}>{w.label}</div>
                      <div className={styles.weekSub}>{w.sub}</div>
                    </div>
                    <span className={cx(styles.weekBadge, w.status === "ok" ? styles.ok : styles.partial)}>
                      {w.status === "ok" ? "RÉUSSIE" : "PARTIELLE"}
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
          {celebrate.icon} Palier {celebrate.threshold} jours débloqué !
        </div>
      )}
    </div>
  );
}
