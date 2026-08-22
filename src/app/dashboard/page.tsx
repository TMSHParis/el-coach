import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isCheckinDoneToday } from "../checkin/actions";
import { getEcmProfileState, getSignupState } from "../signup/actions";
import { clerkEnabled } from "@/lib/clerk";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import type { Alert, EcmScore, SleepInsight, SnackInsight, StackMoment, WeightInsight } from "@/lib/coaching-adaptatif-mock";
import {
  buildAlerts,
  buildSleepInsight,
  buildSnack,
  buildStack4Moments,
  buildWeightInsight,
  computeEcmScore,
  recommendVariant,
} from "@/lib/coaching-adaptatif-mock";

type DashboardOutputJson = {
  ecm: EcmScore;
  recommendedVariant: "A" | "B";
  recommendedReason: string;
  stack: StackMoment[];
  alerts: Alert[];
  snack: SnackInsight;
  sleep: SleepInsight;
  weight: WeightInsight;
};
import { toDisplayBlocks } from "@/lib/session-format";
import { minutesToHM, ETAT_LABELS, sleepPhaseBadge, trendColor } from "./dashboard-helpers";
import { dashboardFontVariables } from "./dashboard-fonts";
import { CalendarWeek } from "./calendar-week";
import { SessionTabs } from "./session-tabs";
import { SessionPanel } from "./session-panel";
import styles from "./dashboard.module.css";

export const metadata = { title: "Dashboard — EL COACH METHOD" };

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export default async function DashboardPage() {
  const demo = await getDemoState();

  let userFirstName: string | null = null;
  if (clerkEnabled) {
    const session = await auth();
    if (session.userId) {
      const user = await currentUser();
      userFirstName = user?.firstName ?? null;
    }
  }
  if (!userFirstName) {
    const ecmProfile = await getEcmProfileState();
    const signup = await getSignupState();
    userFirstName = ecmProfile?.prenom || signup?.firstName || null;
  }

  if (!demo.programSlug) {
    return <EmptyState />;
  }

  if (!(await isCheckinDoneToday())) {
    redirect("/checkin");
  }

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore);
  if (!today) return <EmptyState />;

  const fatigueScore = demo.fatigueScore ?? 3;

  const userId = await getUserId();
  const dbOutput = userId
    ? await prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: todayKey() } } })
    : null;
  const real = dbOutput ? (dbOutput.output as unknown as DashboardOutputJson) : null;

  // Repli sur le moteur mock déterministe si pas encore de profil ECM /
  // génération Claude pour cet utilisateur (mode démo classique inchangé).
  const ecm = real?.ecm ?? computeEcmScore(fatigueScore);
  const sleep = real?.sleep ?? buildSleepInsight(fatigueScore);
  const weight = real?.weight ?? buildWeightInsight(fatigueScore);
  const stack = real ? normalizeStackOrder(real.stack, fatigueScore) : buildStack4Moments(fatigueScore);
  const alerts = real?.alerts ?? buildAlerts(fatigueScore, sleep);
  const snack = real?.snack ?? buildSnack(fatigueScore);
  const variant = real
    ? { recommended: real.recommendedVariant, reason: real.recommendedReason }
    : recommendVariant(ecm);
  const etat = ETAT_LABELS[ecm.state];
  const isRestDay = today.needsFatigueInput || today.day.blocks.length === 0;

  const tomorrow = buildTomorrowPreview(today, fatigueScore);

  return (
    <div className={dashboardFontVariables}>
      <div className={styles.dashRoot}>
        <div className={styles.header}>
          <div className={styles.salut}>Salut {userFirstName ?? "Athlète"}.</div>
        </div>

        <div className={styles.wrap}>
          <CalendarWeek />

          {/* SCORE ECM */}
          <div className={cx(styles.ecmCard, styles[etat.cls])}>
            <div className={styles.ecmLabel}>
              [ SCORE ECM · {etat.label} ]
            </div>
            <div className={styles.ecmTop}>
              <div className={styles.ecmDot} />
              <div className={styles.ecmGrade}>{ecm.letter}</div>
            </div>
            <div className={styles.ecmPhrase}>{ecm.headline}</div>
            <div className={styles.ecmDesc}>{ecm.summary}</div>
            <div className={styles.ecmBottom}>
              <div>
                <div className={styles.ecmScoreLabel}>SCORE /100</div>
                <div className={styles.ecmScoreVal}>{ecm.numeric}</div>
              </div>
            </div>
          </div>

          {/* POIDS */}
          <div className={styles.sl}>Suivi poids</div>
          <div className={styles.weightCard}>
            <div>
              <div className={styles.wLabel}>Poids ce matin</div>
              <div className={styles.wValRow}>
                <div className={styles.wVal}>{weight.today}</div>
                <div className={styles.wUnit}>kg</div>
              </div>
              <div className={cx(styles.wTrend, weight.deltaWeek > 0 ? styles.up : styles.down)}>
                {weight.deltaWeek > 0 ? "▲" : "▼"} {Math.abs(weight.deltaWeek)} kg sur 7 jours
              </div>
            </div>
            <div className={styles.wHistory}>
              <div className={styles.wLabel} style={{ textAlign: "right", marginBottom: 4 }}>
                Historique
              </div>
              {weight.history
                .slice()
                .reverse()
                .slice(0, 3)
                .map((h) => (
                  <div key={h.label} className={styles.whRow}>
                    <span className={styles.whDate}>{h.label}</span>
                    <span className={styles.whVal}>{h.kg} kg</span>
                  </div>
                ))}
            </div>
          </div>

          {/* SOMMEIL */}
          <div className={styles.sl}>Analyse sommeil</div>
          <div className={styles.sleepCard}>
            <div className={styles.sleepHdr}>
              <div>
                <div className={styles.wLabel}>Durée totale estimée</div>
                <div className={styles.sleepTotal}>{minutesToHM(sleep.lastNight.totalMinutes)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className={styles.wLabel}>Éveil</div>
                <div className={styles.sleepEveil} style={{ color: sleep.lastNight.awakeMinutes > 120 ? "var(--red)" : "var(--yellow)" }}>
                  {minutesToHM(sleep.lastNight.awakeMinutes)}
                </div>
              </div>
            </div>
            <div className={styles.phases}>
              <SleepPhaseRow color="#3B82F6" name="Sommeil lent" minutes={sleepLightMinutes(sleep.lastNight)} totalMinutes={sleep.lastNight.totalMinutes} kind="lent" />
              <SleepPhaseRow color="#38bdf8" name="Paradoxal (REM)" minutes={sleep.lastNight.remMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="rem" />
              <SleepPhaseRow color="#818cf8" name="Profond" minutes={sleep.lastNight.deepMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="profond" />
              <SleepPhaseRow color="#ef4444" name="Éveil" minutes={sleep.lastNight.awakeMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="eveil" />
            </div>
            {sleep.alerts.length > 0 && (
              <div className={styles.sleepAlert}>
                <span>⚠️</span>
                <span>{sleep.alerts[0]}</span>
              </div>
            )}
          </div>

          {/* TENDANCE */}
          <div className={styles.trendCard}>
            <div className={styles.trendTitle}>📈 Tendance sommeil — 7 nuits</div>
            <div>
              {sleep.nights.map((n, i) => {
                const isToday = i === sleep.nights.length - 1;
                return (
                  <div key={n.label} className={cx(styles.tr, isToday && styles.trToday)}>
                    <span className={styles.trDate} style={{ color: isToday ? "var(--g)" : "var(--m)" }}>
                      {n.label}
                      {isToday ? " ★" : ""}
                    </span>
                    <span className={styles.trTotal}>{minutesToHM(n.totalMinutes)}</span>
                    <span className={styles.trEveil} style={{ color: trendColor(n.awakeMinutes, "eveil") }}>
                      {minutesToHM(n.awakeMinutes)}
                    </span>
                    <span className={styles.trProfond} style={{ color: trendColor(n.deepMinutes, "profond") }}>
                      {minutesToHM(n.deepMinutes)} profond
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ALERTES */}
          {alerts.length > 0 && (
            <>
              <div className={styles.sl}>Alertes du jour</div>
              <div>
                {alerts.map((a, i) => (
                  <div key={i} className={cx(styles.alertCard, styles[alertCls(a.level)])}>
                    <div className={styles.alertIcon}>{alertIcon(a.category)}</div>
                    <div className={styles.alertText}>
                      <strong>{a.message}</strong>
                      {a.hint}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STACK */}
          <div className={styles.sl}>Stack du jour</div>
          <StackGroup label="🌅 Matin à jeun" items={stack[0].items} />
          <StackGroup label="🍽️ Avec repas midi" items={stack[1].items} />
          <StackGroup label="⚡ Pré-séance" items={stack[2].items} />
          <StackGroup label="🌙 Soir" items={stack[3].items} />

          {/* EN-CAS */}
          <div className={styles.sl}>En-cas du jour</div>
          <div className={styles.snackCard}>
            <div className={styles.snackTitle}>{snack.titre}</div>
            <div className={styles.snackContent}>{snack.contenu}</div>
            <div className={styles.snackNote}>{snack.note}</div>
          </div>

          {/* SÉANCE DU JOUR */}
          <div className={styles.sdj}>
            <div className={styles.sdjLabel}>[ SÉANCE DU JOUR ]</div>
            <div className={styles.sdjTitle}>{isRestDay ? "Repos" : today.day.focus}</div>
            <div className={styles.sdjMeta}>
              {isRestDay ? (
                <span>{today.day.notes ?? "Récupération complète."}</span>
              ) : (
                <span>
                  {minutesToHM(today.day.estimatedMinutes)} · {today.day.blocks.length} bloc
                  {today.day.blocks.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {!isRestDay && (
              <Link href="/session" className={styles.sdjBtn}>
                <span className={styles.sdjBtnIcon}>▷</span>
                <span className={styles.sdjBtnText}>Démarrer la séance</span>
              </Link>
            )}
          </div>

          {!isRestDay && (
            <>
              <div
                style={{
                  background: "var(--s)",
                  border: "1px solid var(--bd)",
                  borderRadius: 4,
                  padding: "9px 13px",
                  marginBottom: 0,
                  fontSize: 11,
                  color: "var(--m)",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span>▶️</span>
                <span>Appuie sur le bouton rouge pour voir la démo YouTube du mouvement</span>
              </div>

              <SessionTabs
                recommended={variant.recommended === "A" ? "a" : "b"}
                recoText={`Recommandée : ${variant.recommended} · ${variant.reason}`}
                labelA="SÉANCE A"
                labelB="SÉANCE B"
                subA="Standard"
                subB="Adaptée"
                panelA={
                  <SessionPanel
                    variant="a"
                    nom={`${today.template.name} — ${today.day.focus}`}
                    duree={minutesToHM(today.day.estimatedMinutes)}
                    difficulte={difficultyFor(today.template.level, "a")}
                    tags={sessionTags(today.day.blocks)}
                    blocs={toDisplayBlocks(today.day.blocks)}
                  />
                }
                panelB={
                  <SessionPanel
                    variant="b"
                    nom={`${today.template.name} — Allégée`}
                    duree={minutesToHM(Math.round(today.day.estimatedMinutes * 0.75))}
                    difficulte={difficultyFor(today.template.level, "b")}
                    tags={sessionTags(today.day.blocks)}
                    blocs={toDisplayBlocks(today.day.blocks)}
                  />
                }
              />
            </>
          )}

          {/* DEMAIN */}
          <div className={styles.sl} style={{ marginTop: 20 }}>
            Demain
          </div>
          <div className={styles.demainCard}>
            <div className={styles.demainTitle}>{tomorrow.titre}</div>
            <div className={styles.demainContent} dangerouslySetInnerHTML={{ __html: tomorrow.contenu }} />
          </div>

          <div className={styles.spacer} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="label">[ DASHBOARD ]</div>
      <h1 className="mt-4 text-4xl font-semibold">Pas encore de programme</h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        Choisis une programmation pour activer ton dashboard, ta semaine et ta séance du jour.
      </p>
      <Link href="/onboarding" className="btn-primary mt-8 inline-flex">
        Choisir mon programme
      </Link>
    </section>
  );
}

function SleepPhaseRow({
  color,
  name,
  minutes,
  totalMinutes,
  kind,
}: {
  color: string;
  name: string;
  minutes: number;
  totalMinutes: number;
  kind: "lent" | "rem" | "profond" | "eveil";
}) {
  const { badge, cls } = sleepPhaseBadge(minutes, kind);
  const pct = totalMinutes > 0 ? Math.min(100, Math.round((minutes / totalMinutes) * 100)) : 0;
  return (
    <div className={styles.ph}>
      <div className={styles.phDot} style={{ background: color }} />
      <div className={styles.phName}>{name}</div>
      <div className={styles.phBarWrap}>
        <div className={styles.phBar} style={{ background: color, width: `${pct}%` }} />
      </div>
      <div className={styles.phTime}>{minutesToHM(minutes)}</div>
      <div className={cx(styles.phBadge, styles[cls])}>{badge}</div>
    </div>
  );
}

function sleepLightMinutes(night: { totalMinutes: number; deepMinutes: number; remMinutes: number; awakeMinutes: number }): number {
  return Math.max(0, night.totalMinutes - night.deepMinutes - night.remMinutes - night.awakeMinutes);
}

function alertCls(level: "info" | "warning" | "critical"): "alertRed" | "alertYellow" | "alertPurple" {
  if (level === "critical") return "alertRed";
  if (level === "warning") return "alertYellow";
  return "alertPurple";
}

function alertIcon(category: "sleep" | "injury" | "recovery" | "hormonal" | "load"): string {
  switch (category) {
    case "sleep":
      return "😴";
    case "injury":
      return "🤕";
    case "recovery":
      return "🔄";
    case "hormonal":
      return "⚗️";
    case "load":
      return "⚠️";
  }
}

const STACK_EMOJI: Record<string, string> = {
  Créatine: "💪",
  Citrulline: "🔥",
  "Vitamines B complex": "🧪",
  Ginseng: "🌿",
  "Oméga 3": "🐟",
  "Vitamine D3": "☀️",
  Zinc: "⚡",
  "Beta-alanine": "🔋",
  Café: "☕",
  Maca: "💊",
  "Magnésium bisglycinate": "😴",
  "Ashwagandha KSM-66": "🌿",
  Collagène: "🧴",
};

function StackGroup({ label, items }: { label: string; items: { name: string; dose?: string; active: boolean; note?: string }[] }) {
  return (
    <>
      <div className={styles.sm}>{label}</div>
      <div className={styles.sg}>
        {items.map((it) => {
          const emoji = STACK_EMOJI[it.name] ?? "•";
          const type = !it.active ? "pillOff" : it.note ? "pillKey" : "pillOn";
          return (
            <div key={it.name} className={cx(styles.pill, styles[type])}>
              {emoji} {it.name}
              {it.dose ? ` · ${it.dose}` : ""}
            </div>
          );
        })}
      </div>
    </>
  );
}

const STACK_SLOT_ORDER = ["morning", "noon", "pre-workout", "evening"] as const;

/** L'ordre du tableau stack[] n'est pas garanti par Claude — on le réordonne pour l'affichage indexé. */
function normalizeStackOrder(stack: StackMoment[], fatigueScore: number): StackMoment[] {
  const bySlot = new Map(stack.map((m) => [m.slot, m]));
  const fallback = buildStack4Moments(fatigueScore);
  return STACK_SLOT_ORDER.map((slot, i) => bySlot.get(slot) ?? fallback[i]);
}

function difficultyFor(level: "beginner" | "intermediate" | "advanced", variant: "a" | "b"): number {
  const base = level === "beginner" ? 2 : level === "advanced" ? 4 : 3;
  return variant === "a" ? base : Math.max(1, base - 1);
}

function sessionTags(blocks: { format?: string }[]): { label: string; cls: "tagBlue" | "tagGreen" | "tagOrange" | "tagRed" | "tagPurple" }[] {
  const formats = [...new Set(blocks.map((b) => b.format).filter((f): f is string => Boolean(f)))].slice(0, 2);
  const clsFor = (f: string): "tagBlue" | "tagGreen" | "tagOrange" | "tagRed" | "tagPurple" => {
    if (f === "AMRAP") return "tagGreen";
    if (f === "EMOM" || f === "E2MOM" || f === "E3MOM") return "tagBlue";
    if (f === "Tabata") return "tagPurple";
    if (f === "ForTime" || f === "RFT") return "tagRed";
    return "tagOrange";
  };
  return formats.map((f) => ({ label: f, cls: clsFor(f) }));
}

function buildTomorrowPreview(
  today: NonNullable<Awaited<ReturnType<typeof resolveTodaySession>>>,
  fatigueScore: number,
): { titre: string; contenu: string } {
  const tomorrowNum = today.dayNumber >= 7 ? 1 : today.dayNumber + 1;
  const week = today.template.weeks[0];
  const tomorrowDay = week.days.find((d) => d.day === tomorrowNum);

  if (!tomorrowDay || tomorrowDay.blocks.length === 0) {
    return {
      titre: "😴 DEMAIN — REPOS",
      contenu: "📸 <strong>Envoie ton check-in ECM</strong> dès le réveil<br>🧘 Récupération complète · sommeil prioritaire",
    };
  }

  const bedtime = fatigueScore >= 7 ? "22h00" : "22h30";
  return {
    titre: `🏋️ DEMAIN — ${today.template.name.toUpperCase()}`,
    contenu: `📸 <strong>Envoie ton check-in ECM</strong> dès le réveil<br>💪 Séance focus <strong>${tomorrowDay.focus}</strong><br>🕕 ${tomorrowDay.estimatedMinutes}min prévues · Dors avant <strong>${bedtime}</strong>`,
  };
}
