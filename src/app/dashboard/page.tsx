import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isCheckinDoneToday } from "../checkin/actions";
import { getEcmProfileState, getSignupState } from "../signup/actions";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
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

type EcmDashboardOutput = {
  /** Absent sur les lignes générées avant l'ajout de ce champ — traité comme "ecm" (comportement historique). */
  mode?: "ecm";
  ecm: EcmScore;
  recommendedVariant: "A" | "B";
  recommendedReason: string;
  stack: StackMoment[];
  alerts: Alert[];
  snack: SnackInsight;
  sleep: SleepInsight;
  weight: WeightInsight;
  /** Séance composée par le moteur de génération dynamique (ecm-engine.ts) — absente si la
   * génération a échoué ou si l'utilisateur n'a pas encore de profil ECM (mode démo). */
  generatedDay?: Day;
  /** Aperçu de la séance de demain d'après la semaine type du profil et l'état
   * du jour — null si la semaine type n'est pas renseignée ou si la génération
   * a échoué (le dashboard retombe alors sur le programme fixe). */
  tomorrow?: TomorrowPreview | null;
  /** Message de félicitations post-séance (généré une fois à la fin de /session,
   * absent tant qu'aucune séance n'a été terminée aujourd'hui). */
  sessionMessage?: string;
  sessionMessageDuration?: string;
};

/** Activité hors des 5 programmes ECM (ou repos) — même dashboard complet, le bloc
 * séance affiche les conseils au lieu de Séance A/B. Les champs d'analyse sont
 * absents sur les lignes générées avant sept. 2026 (repli sur le moteur mock). */
type AdviceDashboardOutput = Partial<Omit<EcmDashboardOutput, "mode" | "generatedDay">> & {
  mode: "advice";
  advice: StoredAdvice;
  generatedAt: string;
};

type DashboardOutputJson = EcmDashboardOutput | AdviceDashboardOutput;
import type { Day } from "@/lib/programming";
import { toDisplayBlocks } from "@/lib/session-format";
import { SESSION_FEELINGS, shouldRecommendLightSession } from "@/lib/session-feeling";
import type { TomorrowPreview } from "@/lib/ecm-engine";
import { buildAdviceSession, type StoredAdvice } from "@/lib/advice-session";
import { AdviceSessionPanel } from "./advice-session-panel";
import { adaptDayForInjuries, detectInjuryAreas, reduceVolume, substitutionMessage } from "@/lib/session-adapt";
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
  const userId = await getUserId();

  // Fetch précoce — sert au repli du prénom (si cookies absents) et au repli
  // du programme (cookie perdu, ex. nouvel appareil) sans attendre le reste.
  const profile = userId ? await prisma.profile.findUnique({ where: { userId } }) : null;

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
    userFirstName = ecmProfile?.prenom || signup?.firstName || profile?.prenom || null;
  }

  // Le cookie du programme peut manquer (nouvel appareil, navigation privée,
  // cookies effacés) alors qu'un profil complet existe déjà en base — dans ce
  // cas on retrouve le programme depuis profile.programme plutôt que
  // d'afficher "Pas encore de programme" à tort.
  const programSlug = demo.programSlug || (profile?.programme ? SPORT_LABEL_TO_SLUG[profile.programme] : null) || null;

  if (!programSlug) {
    return <EmptyState />;
  }

  if (!(await isCheckinDoneToday())) {
    const everCheckedIn = userId ? (await prisma.checkin.count({ where: { userId } })) > 0 : false;
    return <CheckinPendingState userFirstName={userFirstName} everCheckedIn={everCheckedIn} />;
  }

  const today = resolveTodaySession(programSlug, demo.fatigueScore);
  if (!today) return <EmptyState />;

  const fatigueScore = demo.fatigueScore ?? 3;

  const [dbOutput, todayCheckin, recentCheckinRows, todaySession, recentSessions] = userId
    ? await Promise.all([
        prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
        prisma.checkin.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
        prisma.checkin.findMany({ where: { userId }, select: { date: true }, orderBy: { date: "desc" }, take: 60 }),
        prisma.session.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
        // Deux dernières séances terminées — deux "difficile" d'affilée font
        // basculer la recommandation sur la séance B.
        prisma.session.findMany({
          where: { userId, completed: true, date: { lt: todayKey() } },
          select: { sessionFeeling: true },
          orderBy: { date: "desc" },
          take: 2,
        }),
      ])
    : [null, null, [], null, []];

  const real = dbOutput ? (dbOutput.output as unknown as DashboardOutputJson) : null;

  // Sport hors ECM ou repos : même dashboard, seul le bloc séance change.
  const advice = real?.mode === "advice" ? real.advice : null;
  const adviceSession = advice ? buildAdviceSession(todayCheckin?.seance ?? null, advice) : null;
  const generatedDay = real?.mode === "advice" ? undefined : real?.generatedDay;

  const checkinDates = recentCheckinRows.map((c) => c.date);

  const injuryAreas = detectInjuryAreas(
    profile?.blessures ? profile.blessuresDetail : null,
    todayCheckin?.douleur ? todayCheckin.douleurDetail : null,
  );
  // La séance composée par Claude (moteur de génération dynamique) prime sur le
  // programme fixe hebdomadaire dès qu'elle existe pour aujourd'hui.
  const baseDay = generatedDay ?? today.day;
  const sessionTitle = generatedDay ? baseDay.focus : `${today.template.name} — ${baseDay.focus}`;
  const adapted = adaptDayForInjuries(baseDay, injuryAreas);
  const safeDay = adapted.day;
  // Pas de séance ECM à adapter les jours hors ECM / repos → pas d'alertes de substitution.
  const substitutions = advice ? [] : adapted.substitutions;
  const lightDay = reduceVolume(safeDay);

  // Repli sur le moteur mock déterministe si pas encore de profil ECM /
  // génération Claude pour cet utilisateur (mode démo classique inchangé).
  const ecm = real?.ecm ?? computeEcmScore(fatigueScore);
  const sleep = real?.sleep ?? buildSleepInsight(fatigueScore);
  const weight = real?.weight ?? buildWeightInsight(fatigueScore);
  const stack = real?.stack ? normalizeStackOrder(real.stack, fatigueScore) : buildStack4Moments(fatigueScore);
  const baseAlerts = real?.alerts ?? buildAlerts(fatigueScore, sleep);
  // Une alerte par problème : on retire les doublons de message et celle déjà
  // affichée dans la carte sommeil (elle y apparaissait une 2e fois ici).
  const sleepCardAlert = sleep.alerts[0];
  const seenMessages = new Set<string>(sleepCardAlert ? [sleepCardAlert] : []);
  const alerts: Alert[] = [
    ...baseAlerts.filter((a) => {
      if (seenMessages.has(a.message)) return false;
      seenMessages.add(a.message);
      return true;
    }),
    ...substitutions.map((s) => ({
      level: "info" as const,
      category: "injury" as const,
      message: substitutionMessage(s),
      hint: s.reason,
    })),
  ];
  const snack = real?.snack ?? buildSnack(fatigueScore);
  const baseVariant =
    real?.recommendedVariant && real.recommendedReason
      ? { recommended: real.recommendedVariant, reason: real.recommendedReason }
      : recommendVariant(ecm);
  // Deux séances ressenties "difficile" de suite → on allège, quel que soit le score.
  const variant = shouldRecommendLightSession(recentSessions.map((s) => s.sessionFeeling))
    ? { recommended: "B" as const, reason: "deux séances difficiles d'affilée" }
    : baseVariant;
  const etat = ETAT_LABELS[ecm.state];
  const isRestDay = (!generatedDay && today.needsFatigueInput) || baseDay.blocks.length === 0;

  // Type réel de la séance du jour — sert au bloc "Séance terminée" une fois
  // la séance faite. Ne PAS retomber sur profile.programme (programme fixe de
  // l'athlète) : un jour de repos ou hors ECM affichait alors à tort le nom du
  // programme d'abonnement (ex. "CrossFit Pure" sur un jour "Repos complet").
  const todaySessionKind: "repos" | "horsEcm" | "ecm" = adviceSession
    ? adviceSession.repos
      ? "repos"
      : "horsEcm"
    : isRestDay
      ? "repos"
      : "ecm";
  const todaySessionLabel = adviceSession
    ? adviceSession.repos
      ? "Repos complet"
      : adviceSession.titre
    : isRestDay
      ? "Repos complet"
      : sessionTitle;
  const todaySessionIcon = todaySessionKind === "repos" ? "🛌" : todaySessionKind === "horsEcm" ? "🥊" : "⚡";

  // Séance du jour terminée : le bloc "Démarrer la séance" laisse place au compte rendu.
  const finishedSession = todaySession?.completed
    ? {
        durationSec: todaySession.durationSec ?? 0,
        completionRate: todaySession.completionRate ?? 0,
        feeling: todaySession.sessionFeeling,
        calories: todaySession.caloriesBrulees,
        best: todaySession.bestResult as { nom: string; charge: number; reps: string } | null,
        programme: todaySessionLabel,
        icon: todaySessionIcon,
        coachMessage: real?.sessionMessage ?? null,
      }
    : null;

  // La semaine type prime : l'aperçu généré au check-in tient compte de l'état
  // du jour et des blessures. Sinon, repli sur le programme fixe hebdomadaire.
  const tomorrow = real?.tomorrow ?? buildTomorrowPreview(today, fatigueScore);

  return (
    <div className={dashboardFontVariables}>
      <div className={styles.dashRoot}>
        <div className={styles.header}>
          {/* Retour toujours vers l'accueil (pas d'historique : /session/recap
              renvoie ici, un retour "intelligent" y repartirait en boucle). */}
          <Link href="/" className={styles.backLink}>
            ← Accueil
          </Link>
          <div className={styles.salut}>Salut {userFirstName ?? "Athlète"}.</div>
        </div>

        <div className={styles.wrap}>
          <CalendarWeek checkinDates={checkinDates} />
          <Link href="/progress" className={styles.progressLink}>
            📈 Voir ma progression →
          </Link>

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
              <SleepPhaseRow color="#3B82F6" name="Sommeil lent" minutes={sleep.lastNight.lightMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="lent" />
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

          {/* SÉANCE DU JOUR — contenu selon le check-in, structure identique */}
          {finishedSession ? (
            <SessionRecapCard {...finishedSession} />
          ) : adviceSession ? (
            <>
              <div className={styles.sdj}>
                <div className={styles.sdjLabel}>
                  {adviceSession.repos
                    ? "[ REPOS ACTIF ]"
                    : `[ SÉANCE DU JOUR — ${adviceSession.titre.toUpperCase()} ]`}
                </div>
                <div className={styles.sdjTitle}>
                  {adviceSession.emoji ? `${adviceSession.emoji} ` : ""}
                  {adviceSession.titre}
                </div>
                <div className={styles.sdjMeta}>
                  <span>
                    {adviceSession.dureeEstimee} · {adviceSession.blocks.length} blocs
                  </span>
                </div>
                <Link href="/session" className={styles.sdjBtn}>
                  <span className={styles.sdjBtnIcon}>▷</span>
                  <span className={styles.sdjBtnText}>Démarrer la séance</span>
                </Link>
              </div>
              <AdviceSessionPanel
                nom={adviceSession.titre}
                duree={adviceSession.dureeEstimee}
                blocs={adviceSession.blocks}
              />
            </>
          ) : (
            <>
              <div className={styles.sdj}>
                <div className={styles.sdjLabel}>[ SÉANCE DU JOUR ]</div>
                <div className={styles.sdjTitle}>{isRestDay ? "Repos" : baseDay.focus}</div>
                <div className={styles.sdjMeta}>
                  {isRestDay ? (
                    <span>{baseDay.notes ?? "Récupération complète."}</span>
                  ) : (
                    <span>
                      {minutesToHM(baseDay.estimatedMinutes)} · {baseDay.blocks.length} bloc
                      {baseDay.blocks.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {!isRestDay && (
                  <Link
                    href={`/session?variant=${variant.recommended === "A" ? "a" : "b"}`}
                    className={styles.sdjBtn}
                  >
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
                        nom={sessionTitle}
                        duree={minutesToHM(safeDay.estimatedMinutes)}
                        difficulte={difficultyFor(today.template.level, "a")}
                        tags={sessionTags(safeDay.blocks)}
                        blocs={toDisplayBlocks(safeDay.blocks)}
                      />
                    }
                    panelB={
                      <SessionPanel
                        variant="b"
                        nom={`${sessionTitle} — Allégée`}
                        duree={minutesToHM(lightDay.estimatedMinutes)}
                        difficulte={difficultyFor(today.template.level, "b")}
                        tags={sessionTags(lightDay.blocks)}
                        blocs={toDisplayBlocks(lightDay.blocks)}
                      />
                    }
                  />
                </>
              )}
            </>
          )}

          {/* DEMAIN */}
          <div className={styles.sl} style={{ marginTop: 20 }}>
            Demain
          </div>
          <div className={styles.demainCard}>
            <div className={styles.demainTitle}>{tomorrow.titre}</div>
            <div className={styles.demainContent}>
              {tomorrow.lignes.map((ligne, i) => (
                <div key={i}>{ligne}</div>
              ))}
            </div>
          </div>

          <div className={styles.spacer} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className={`mx-auto max-w-3xl px-6 py-24 text-center ${dashboardFontVariables}`}>
      <div className="label">[ DASHBOARD ]</div>
      <h1 className="mt-4 text-4xl font-semibold" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: 1 }}>
        Pas encore de programme
      </h1>
      <p className="mt-4 text-[color:var(--color-mute)]">
        Choisis une programmation pour activer ton dashboard, ta semaine et ta séance du jour.
      </p>
      <Link href="/onboarding" className="btn-primary mt-8 inline-flex">
        Choisir mon programme
      </Link>
    </section>
  );
}

function CheckinPendingState({
  userFirstName,
  everCheckedIn,
}: {
  userFirstName: string | null;
  everCheckedIn: boolean;
}) {
  const salut = userFirstName ? `Salut ${userFirstName}.` : "Salut.";
  return (
    <section className={`mx-auto max-w-3xl px-6 py-24 text-center ${dashboardFontVariables}`}>
      <div className="label">[ DASHBOARD ]</div>
      <h1 className="mt-4 text-4xl font-semibold" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: 1 }}>
        {salut}
      </h1>
      {everCheckedIn ? (
        <p className="mt-4 text-[color:var(--color-mute)]">Ton plan du jour n&apos;est pas encore généré.</p>
      ) : (
        <p className="mt-4 text-[color:var(--color-mute)]">
          Un check-in chaque matin suffit à générer ton plan sur mesure — séance, stack, récupération.
        </p>
      )}
      <Link href="/checkin" className="btn-gold mt-8 inline-flex">
        {everCheckedIn ? "Faire mon check-in maintenant" : "Commencer mon premier check-in"}
      </Link>
    </section>
  );
}

/** Date du jour affichée dans l'en-tête du bloc "Séance terminée" — "VEN 25 SEPT". */
function todayLabel(): string {
  return new Date()
    .toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase()
    .replace(/\./g, "");
}

/** Compte rendu du jour, à la place du bloc "Démarrer la séance" une fois la séance faite —
 * bloc unique fusionnant stats et message du coach (avant : deux blocs distincts et redondants). */
function SessionRecapCard({
  durationSec,
  completionRate,
  feeling,
  best,
  programme,
  icon,
  coachMessage,
}: {
  durationSec: number;
  completionRate: number;
  feeling: string | null;
  calories: number | null;
  best: { nom: string; charge: number; reps: string } | null;
  programme: string | null;
  icon: string;
  coachMessage: string | null;
}) {
  const percent = Math.round(completionRate * 100);
  const feelingInfo = SESSION_FEELINGS.find((f) => f.value === feeling);
  const durationLabel = durationSec < 60 ? `${durationSec}s` : minutesToHM(Math.round(durationSec / 60));

  return (
    <div className={styles.doneCard}>
      <div className={styles.doneHeader}>
        <span className={styles.doneHeaderTitle}>🏆 Séance terminée</span>
        <span className={styles.doneHeaderDate}>{todayLabel()}</span>
      </div>

      {programme && (
        <div className={styles.doneSubheader}>
          <span>{icon}</span>
          <span>{programme.toUpperCase()}</span>
        </div>
      )}

      <div className={styles.doneStats}>
        <div className={styles.doneStat}>
          <div className={styles.doneStatVal}>{durationLabel}</div>
          <div className={styles.doneStatLabel}>Durée</div>
        </div>
        <div className={cx(styles.doneStat, styles.doneStatMid)}>
          <div className={styles.doneStatVal}>{percent}%</div>
          <div className={styles.doneStatLabel}>Complété</div>
        </div>
        <div className={styles.doneStat}>
          <div className={styles.doneStatVal}>{feelingInfo?.emoji ?? "—"}</div>
          <div className={styles.doneStatLabel}>{feelingInfo?.label ?? "Ressenti"}</div>
        </div>
      </div>

      {best && (
        <div className={styles.doneBest}>
          <div className={styles.bestResultTitle}>Meilleur résultat du jour</div>
          <div className={styles.snackContent}>
            {best.nom} — {best.charge} kg × {best.reps || "—"}
          </div>
        </div>
      )}

      {coachMessage && (
        <div className={styles.doneCoach}>
          <div className={styles.doneCoachLabel}>Ton coach</div>
          <div className={styles.doneCoachText}>{coachMessage}</div>
        </div>
      )}

      <Link href="/session/recap" className={styles.doneCta}>
        Voir le détail complet →
      </Link>
    </div>
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

/** Repli quand la semaine type n'est pas renseignée : le programme fixe hebdomadaire. */
function buildTomorrowPreview(
  today: NonNullable<Awaited<ReturnType<typeof resolveTodaySession>>>,
  fatigueScore: number,
): TomorrowPreview {
  const tomorrowNum = today.dayNumber >= 7 ? 1 : today.dayNumber + 1;
  const week = today.template.weeks[0];
  const tomorrowDay = week.days.find((d) => d.day === tomorrowNum);

  if (!tomorrowDay || tomorrowDay.blocks.length === 0) {
    return {
      titre: "😴 DEMAIN — REPOS",
      lignes: ["📸 Envoie ton check-in ECM dès le réveil", "🧘 Récupération complète · sommeil prioritaire"],
    };
  }

  const bedtime = fatigueScore >= 7 ? "22h00" : "22h30";
  return {
    titre: `🏋️ DEMAIN — ${today.template.name.toUpperCase()}`,
    lignes: [
      "📸 Envoie ton check-in ECM dès le réveil",
      `💪 Séance focus ${tomorrowDay.focus}`,
      `🕕 ${tomorrowDay.estimatedMinutes} min prévues · dors avant ${bedtime}`,
    ],
  };
}
