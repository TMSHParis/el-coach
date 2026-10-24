import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { BackHomeButton } from "@/components/back-home-button";
import { isCheckinDoneToday } from "../checkin/actions";
import { getEcmProfileState, getSignupState } from "../signup/actions";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { clerkEnabled } from "@/lib/clerk";
import { getDemoState, resolveTodaySession, todayDayNumber } from "@/lib/demo-session";
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
  localizeStored,
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
import { buildAdviceSession, stripLeadingEmoji, type StoredAdvice } from "@/lib/advice-session";
import { isRestDay as isRestDaySeance } from "@/lib/ecm-engine";
import { adaptDayForInjuries, detectInjuryAreas, reduceVolume, substitutionMessage } from "@/lib/session-adapt";
import { minutesToHM, ETAT_LABELS, sleepPhaseBadge, trendColor } from "./dashboard-helpers";
import { dashboardFontVariables } from "./dashboard-fonts";
import { CalendarWeek } from "./calendar-week";
import { SessionTabs } from "./session-tabs";
import { resolveSequenceToday } from "@/lib/program-position";
import { getOrCreateActiveBlock } from "@/lib/training-block";
import { applyLevel, levelForToday } from "@/lib/level";
import { cookies } from "next/headers";
import { applyChains } from "@/lib/chains";
import { applyDaySubstitutions, NO_IMPACT_COOKIE, ZONE_COOKIE } from "@/lib/substitutions";
import { getChainLevels } from "@/lib/chain-progress";
import { homeLevelForToday } from "@/lib/home-equipment";
import { applyCompetition } from "@/lib/competition-day";
import { competitionPlanFor, effectiveTheme, objectifsOf } from "@/lib/competition";
import { CompetitionCard } from "./competition-card";
import { ActivityCard, ActivitySectionTitle, AddActivityLink, type ActivityCardData } from "./activity-card";
import { WEEK_DAYS } from "@/lib/week-cycle";
import { freeActivityMessage } from "@/lib/recap-text";
import { loadsLine } from "@/lib/hyrox-reference";
import { applyBlockToDay, themeLabel } from "@/lib/training-themes";
import { effectiveWeekCycle } from "@/lib/week-overrides";
import { variantHint, variantLabel, parseVariant, resolveModularDay, type ModularVariant } from "@/lib/session-modular";
import { SessionPreviewToggle } from "./session-preview-toggle";
import { ApercuCards } from "./apercu-panel";
import { blocksToApercuCards } from "./apercu-cards";
import { TomorrowSection } from "./tomorrow-section";
import { buildTomorrow, reportedZone } from "@/lib/tomorrow-plan";
import { getT } from "@/lib/i18n/server";
import { tc } from "@/lib/i18n/content";
import { formatDate, formatNumber, type Translate } from "@/lib/i18n";
import type { TomorrowPreview } from "@/lib/ecm-engine";
import styles from "./dashboard.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("dash.meta.title") };
}

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ v?: string; d?: string }> }) {
  const { v: modularParam, d: dayParam } = await searchParams;
  const { t, lang } = await getT();
  // Textes des builders déterministes (ou stockés en français en base) : traduits à l'affichage.
  const L = (text: string) => localizeStored(lang, text);
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
    return <EmptyState t={t} />;
  }

  if (!(await isCheckinDoneToday())) {
    const everCheckedIn = userId ? (await prisma.checkin.count({ where: { userId } })) > 0 : false;
    return <CheckinPendingState userFirstName={userFirstName} everCheckedIn={everCheckedIn} t={t} />;
  }

  const weekdayToday = resolveTodaySession(programSlug, demo.fatigueScore);
  if (!weekdayToday) return <EmptyState t={t} />;
  // Suite ordonnée (1.4) : la séance suivante de la suite, sinon le jour de la semaine.
  const effCycle = userId ? await effectiveWeekCycle(userId, profile?.weekCycle, todayKey()) : profile?.weekCycle;
  const seq = userId
    ? await resolveSequenceToday({
        userId,
        slug: programSlug,
        weekCycle: effCycle,
        fatigueScore: demo.fatigueScore,
        manualDay: dayParam ? Number(dayParam) : null,
      })
    : null;
  const today = seq ? { ...weekdayToday, day: seq.day, dayNumber: seq.dayNumber, needsFatigueInput: false } : weekdayToday;

  const fatigueScore = demo.fatigueScore ?? 3;

  const [dbOutput, todayCheckin, recentCheckinRows, todaySession, recentSessions, extraActivities] = userId
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
        // 2e (ou 3e...) activité du jour (doc G.3), empilée sous la séance principale.
        prisma.extraActivity.findMany({ where: { userId, date: todayKey() }, orderBy: { createdAt: "asc" } }),
      ])
    : [null, null, [], null, [], []];

  const real = dbOutput ? (dbOutput.output as unknown as DashboardOutputJson) : null;

  // Sport hors ECM ou repos : même dashboard, seul le bloc séance change.
  const advice = real?.mode === "advice" ? real.advice : null;
  const adviceSession = advice ? buildAdviceSession(todayCheckin?.seance ?? null, advice, t) : null;
  const generatedDay = real?.mode === "advice" ? undefined : real?.generatedDay;

  const checkinDates = recentCheckinRows.map((c) => c.date);

  const injuryAreas = detectInjuryAreas(
    profile?.blessures ? profile.blessuresDetail : null,
    todayCheckin?.douleur ? todayCheckin.douleurDetail : null,
  );
  // La séance composée par Claude (moteur de génération dynamique) prime sur le
  // programme fixe hebdomadaire dès qu'elle existe pour aujourd'hui.
  // Gap connu (doc H.15) : `today.day` (resolveTodaySession) ne lit jamais
  // profile.weekCycle — avant le check-in du jour (pas encore de
  // generatedDay), cette carte peut donc proposer le mauvais sport si le
  // planning personnalisé du profil diffère du programme de base. Pas de fix
  // ici : weekCycle ne porte qu'un sport/horaire, pas un Day structuré avec
  // des blocs — contrairement au check-in (resolvePlannedToday, demo-session.ts),
  // cette carte a besoin d'un Day complet pour Aperçu/Démarrer.
  const baseDay = generatedDay ?? today.day;
  const sessionTitle = generatedDay ? tc(lang, baseDay.focus) : `${today.template.name} — ${tc(lang, baseDay.focus)}`;
  // Bloc d'entraînement en cours : thème, puis décharge sur la dernière semaine (1.6, 1.12).
  const activeBlock = userId ? await getOrCreateActiveBlock(userId, programSlug, todayKey()) : null;
  const themedBase = activeBlock
    ? applyBlockToDay(baseDay, {
        slug: programSlug,
        theme: effectiveTheme(activeBlock.theme, profile?.programme, profile, todayKey()),
        week: activeBlock.info,
        weakPoints: activeBlock.weakPoints,
        dayNumber: today.dayNumber,
        t,
      })
    : baseDay;
  // Mode compétition (partie 3) : préparation de l'événement d'après la date (Hyrox : phases dédiées).
  const competition = applyCompetition(themedBase, profile, programSlug, todayKey(), t);
  const hyroxPrep = competition.hyroxPrep;
  const prepBase = competition.day;
  const competitionPlan = competitionPlanFor(profile, todayKey());
  const weekDaysForCard = today.template.weeks[0].days
    .slice()
    .sort((x, y) => x.day - y.day)
    .map((d) => ({
      jour: d.day >= 1 && d.day <= 7 ? t(`dash.day.${d.day as 1 | 2 | 3 | 4 | 5 | 6 | 7}`) : t("dash.dayN", { n: d.day }),
      titre: d.blocks.length > 0 ? tc(lang, d.focus) : t("dash.rest"),
    }));
  const leveledBase = applyLevel(prepBase, levelForToday(effCycle as Parameters<typeof levelForToday>[0], programSlug, profile?.niveau, today.dayNumber));
  // At Home : cran actuel des chaînes de progression et niveau de matériel du jour (2.7).
  const homeBase =
    userId && programSlug === "at-home"
      ? applyChains(
          leveledBase,
          await getChainLevels(userId),
          homeLevelForToday(todayCheckin?.seanceEquipement, profile?.equipement),
        )
      : leveledBase;
  const adapted = adaptDayForInjuries(homeBase, injuryAreas, t);
  const jar = await cookies();
  const injurySafeDay = applyDaySubstitutions(adapted.day, {
    zone: jar.get(ZONE_COOKIE)?.value ? decodeURIComponent(jar.get(ZONE_COOKIE)!.value) : null,
    noImpact: jar.get(NO_IMPACT_COOKIE)?.value === "1",
  });
  // Pas de séance ECM à adapter les jours hors ECM / repos → pas d'alertes de substitution.
  const substitutions = advice ? [] : adapted.substitutions;

  // Repli sur le moteur mock déterministe si pas encore de profil ECM /
  // génération Claude pour cet utilisateur (mode démo classique inchangé).
  const ecm = real?.ecm ?? computeEcmScore(fatigueScore);

  // Structure modulable B1-B5 : état du jour puis variante (choisie, sinon proposée).
  const nextTemplateDay = generatedDay ? null : today.template.weeks[0].days.find((d) => d.day === (today.dayNumber % 7) + 1);
  const modular = resolveModularDay({
    day: injurySafeDay,
    state: ecm.state,
    chosen: parseVariant(modularParam),
    goalText: profile?.objectif,
    availableLabel: todayCheckin?.seanceDuree,
    format: todayCheckin?.seanceFormat,
    isDeload: activeBlock?.info.isDeload,
    nextDayFocus: nextTemplateDay?.focus,
    t,
  });
  const safeDay = modular.day;
  const lightDay = reduceVolume(safeDay);
  const sleep = real?.sleep ?? buildSleepInsight(fatigueScore);
  const weight = real?.weight ?? buildWeightInsight(fatigueScore);
  const stack = real?.stack ? normalizeStackOrder(real.stack, fatigueScore) : buildStack4Moments(fatigueScore);
  const baseAlerts = real?.alerts ?? buildAlerts(fatigueScore, sleep);
  // Une alerte par problème : on retire les doublons de message et celle déjà
  // affichée dans la carte sommeil (elle y apparaissait une 2e fois ici).
  const sleepCardAlert = sleep.alerts[0] ? L(sleep.alerts[0]) : undefined;
  const seenMessages = new Set<string>(sleepCardAlert ? [sleepCardAlert] : []);
  const alerts: Alert[] = [
    ...baseAlerts
      .map((a) => ({ ...a, message: L(a.message), hint: a.hint ? L(a.hint) : a.hint }))
      .filter((a) => {
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
    ? { recommended: "B" as const, reason: t("dash.reasonTwoHard") }
    : { ...baseVariant, reason: L(baseVariant.reason) };
  const etat = ETAT_LABELS[ecm.state];
  const isRestDay = (!generatedDay && today.needsFatigueInput) || baseDay.blocks.length === 0;

  // Type réel de la séance du jour — sert au bloc "Séance terminée" une fois
  // la séance faite. Source de vérité : todayCheckin.seance en premier lieu —
  // PAS adviceSession/le programme fixe hebdomadaire (profile.programme), qui
  // restent tous les deux indisponibles ou périmés si la génération Claude du
  // jour a échoué ou est absente. Sans ce garde-fou, un jour de repos ou hors
  // ECM affichait alors à tort le nom du programme d'abonnement (ex. "CrossFit
  // Pure" sur un jour "Repos complet") — cf. /session/recap qui lit déjà
  // checkin.seance directement pour la même raison.
  const checkinSeance = todayCheckin?.seance ?? null;
  const checkinIsRest = isRestDaySeance(checkinSeance);
  const checkinIsEcmProgram = checkinSeance ? checkinSeance in SPORT_LABEL_TO_SLUG : false;
  const todaySessionKind: "repos" | "horsEcm" | "ecm" = checkinIsRest
    ? "repos"
    : checkinSeance && !checkinIsEcmProgram
      ? "horsEcm"
      : adviceSession
        ? adviceSession.repos
          ? "repos"
          : "horsEcm"
        : isRestDay
          ? "repos"
          : "ecm";
  const todaySessionLabel = checkinIsRest
    ? t("dash.restFull")
    : checkinSeance && !checkinIsEcmProgram
      ? (adviceSession?.titre ?? stripLeadingEmoji(checkinSeance))
      : adviceSession
        ? adviceSession.titre
        : isRestDay
          ? t("dash.restFull")
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
  // Section « Demain » (partie 5, mission 1) : uniquement la semaine enregistrée dans le profil, lue pour demain.
  const tomorrowCards = userId
    ? await buildTomorrow({
        userId,
        weekCycle: profile?.weekCycle,
        lang,
        zone: reportedZone({
          profileBlessures: profile?.blessures,
          profileDetail: profile?.blessuresDetail,
          checkinDouleur: todayCheckin?.douleur,
          checkinDetail: todayCheckin?.douleurDetail,
        }),
        doneTodaySlug: todaySession?.completed ? ((todaySession.data as { programSlug?: string } | null)?.programSlug ?? null) : null,
      }).catch(() => null)
    : null;

  // 2e (ou 3e...) activité du jour (doc G.3) — même traitement visuel que la
  // séance principale, empilée en dessous, statut indépendant par activité.
  // Cartes « Activité du jour » (partie 4, mission 1) : A séance ECM, B autre activité, C repos.
  const dateLabel = (() => {
    const label = formatDate(lang, new Date(), { weekday: "short", day: "numeric", month: "short" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  })();
  const plannedRestToday = (() => {
    const day = (effCycle as Record<string, { repos?: boolean; slots?: unknown[] }> | null | undefined)?.[WEEK_DAYS[todayDayNumber() - 1]];
    return !!day && (day.repos || (day.slots?.length ?? 0) === 0);
  })();
  const feelingOf = (v: string | null) => {
    const f = SESSION_FEELINGS.find((x) => x.value === v);
    return f ? { emoji: f.emoji, label: t(`dash.feeling.${f.value}`) } : null;
  };
  const freeDetail = (restLike: boolean) => (restLike || plannedRestToday ? t("dash.freeRest") : t("dash.nonEcm"));
  const mainProgramSlug = (todaySession?.data as { programSlug?: string } | null)?.programSlug;
  const seanceNumber =
    mainProgramSlug && userId
      ? (await prisma.session.findMany({ where: { userId, completed: true }, select: { data: true } })).filter(
          (r) => (r.data as { programSlug?: string } | null)?.programSlug === mainProgramSlug,
        ).length
      : 0;
  const mainEnergy = (todaySession?.data as { energie?: number } | null)?.energie ?? todayCheckin?.energie ?? null;
  const mainCard: ActivityCardData = {
    situation: todaySessionKind === "ecm" ? "A" : "B",
    dateLabel,
    durationSec: todaySession?.durationSec ?? 0,
    icon: todaySessionIcon,
    name: todaySessionKind === "ecm" ? (checkinSeance ? stripLeadingEmoji(checkinSeance) : today.template.name) : todaySessionLabel,
    detail:
      todaySessionKind === "ecm"
        ? seanceNumber > 0
          ? t("dash.sessionNo", { focus: tc(lang, baseDay.focus), n: seanceNumber })
          : tc(lang, baseDay.focus)
        : freeDetail(todaySessionKind === "repos"),
    percent: Math.round((todaySession?.completionRate ?? 0) * 100),
    energy: mainEnergy,
    feeling: feelingOf(todaySession?.sessionFeeling ?? null),
    // Hors situation A, jamais de pourcentage dans le message : texte positif fondé sur la durée et l'énergie.
    coachMessage:
      todaySessionKind === "ecm"
        ? (real?.sessionMessage ?? null)
        : freeActivityMessage({ prenom: userFirstName ?? "", durationSec: todaySession?.durationSec ?? 0, energie: mainEnergy, recuperation: todaySessionKind === "repos" }),
    detailHref: "/session/recap",
  };
  const restCard: ActivityCardData = { situation: "C", dateLabel, detailHref: "/session/repos" };

  const extraActivityCards = extraActivities.map((a) => ({
    id: a.id,
    seanceLabel: stripLeadingEmoji(a.seance),
    icon: isRestDaySeance(a.seance) ? "🛌" : a.seance in SPORT_LABEL_TO_SLUG ? "⚡" : "🥊",
    completed: a.completed,
    durationSec: a.durationSec ?? 0,
    completionRate: a.completionRate ?? 0,
    feeling: a.sessionFeeling,
    calories: a.caloriesBrulees,
    best: a.bestResult as { nom: string; charge: number; reps: string } | null,
    coachMessage: a.coachMessage,
    heureReelle: a.heureReelle,
    card: {
      situation: a.seance in SPORT_LABEL_TO_SLUG ? "A" : "B",
      dateLabel,
      durationSec: a.durationSec ?? 0,
      icon: isRestDaySeance(a.seance) ? "🛌" : a.seance in SPORT_LABEL_TO_SLUG ? "⚡" : "🥊",
      name: stripLeadingEmoji(a.seance),
      detail: a.seance in SPORT_LABEL_TO_SLUG ? t("dash.sessionAdded") : freeDetail(isRestDaySeance(a.seance)),
      percent: Math.round((a.completionRate ?? 0) * 100),
      energy: (a.data as { energie?: number } | null)?.energie ?? todayCheckin?.energie ?? null,
      feeling: feelingOf(a.sessionFeeling),
      coachMessage:
        a.seance in SPORT_LABEL_TO_SLUG
          ? a.coachMessage
          : freeActivityMessage({
              prenom: userFirstName ?? "",
              durationSec: a.durationSec ?? 0,
              energie: (a.data as { energie?: number } | null)?.energie ?? todayCheckin?.energie ?? null,
              recuperation: isRestDaySeance(a.seance),
            }),
      detailHref: `/session/extra/${a.id}/recap`,
    } as ActivityCardData,
  }));

  // Tri par heure réelle plutôt que par ordre d'ajout (doc G.3/mockup
  // dashboard 2 séances) : la séance principale non terminée reste toujours
  // en dernier (comme le mockup), les activités terminées (principale +
  // supplémentaires) se trient entre elles par heure.
  const primaryHeure = todaySession?.createdAt
    ? `${String(todaySession.createdAt.getHours()).padStart(2, "0")}:${String(todaySession.createdAt.getMinutes()).padStart(2, "0")}`
    : null;
  const doneExtrasBeforePrimary = extraActivityCards.filter(
    (a) => a.completed && (!finishedSession || !primaryHeure || (a.heureReelle ?? "99:99") < primaryHeure),
  );
  const doneExtrasAfterPrimary = extraActivityCards.filter(
    (a) => a.completed && finishedSession && primaryHeure && (a.heureReelle ?? "99:99") >= primaryHeure,
  );
  const notDoneExtras = extraActivityCards.filter((a) => !a.completed);

  const blocksLabel = (n: number) => t(n > 1 ? "dash.blocks.many" : "dash.blocks.one", { n });

  return (
    <div className={dashboardFontVariables}>
      <div className={styles.dashRoot}>
        <div className={styles.header}>
          {/* Retour toujours vers l'accueil (pas d'historique : /session/recap
              renvoie ici, un retour "intelligent" y repartirait en boucle). */}
          <Link href="/" className={styles.backLink}>
            {t("dash.back")}
          </Link>
          <div className={styles.salut}>{t("dash.hello", { name: userFirstName ?? t("dash.helloAthlete") })}</div>
        </div>

        <div className={styles.wrap}>
          <CalendarWeek checkinDates={checkinDates} />
          <Link href="/progress" className={styles.progressLink}>
            {t("dash.progress")}
          </Link>

          {/* SCORE ECM */}
          <div className={cx(styles.ecmCard, styles[etat.cls])}>
            <div className={styles.ecmLabel}>
              {t("dash.ecm.label", { state: t(etat.label) })}
            </div>
            <div className={styles.ecmTop}>
              <div className={styles.ecmDot} />
              <div className={styles.ecmGrade}>{ecm.letter}</div>
            </div>
            <div className={styles.ecmPhrase}>{L(ecm.headline)}</div>
            <div className={styles.ecmDesc}>{L(ecm.summary)}</div>
            <div className={styles.ecmBottom}>
              <div>
                <div className={styles.ecmScoreLabel}>{t("dash.ecm.score")}</div>
                <div className={styles.ecmScoreVal}>{ecm.numeric}</div>
              </div>
            </div>
          </div>

          {/* POIDS */}
          <div className={styles.sl}>{t("dash.weight.title")}</div>
          <div className={styles.weightCard}>
            <div>
              <div className={styles.wLabel}>{t("dash.weight.morning")}</div>
              <div className={styles.wValRow}>
                <div className={styles.wVal}>{formatNumber(lang, weight.today)}</div>
                <div className={styles.wUnit}>kg</div>
              </div>
              <div className={cx(styles.wTrend, weight.deltaWeek > 0 ? styles.up : styles.down)}>
                {t("dash.weight.delta", { arrow: weight.deltaWeek > 0 ? "▲" : "▼", n: formatNumber(lang, Math.abs(weight.deltaWeek)) })}
              </div>
            </div>
            <div className={styles.wHistory}>
              <div className={styles.wLabel} style={{ textAlign: "right", marginBottom: 4 }}>
                {t("dash.weight.history")}
              </div>
              {weight.history
                .slice()
                .reverse()
                .slice(0, 3)
                .map((h) => (
                  <div key={h.label} className={styles.whRow}>
                    <span className={styles.whDate}>{L(h.label)}</span>
                    <span className={styles.whVal}>{formatNumber(lang, h.kg)} kg</span>
                  </div>
                ))}
            </div>
          </div>

          {/* SOMMEIL */}
          <div className={styles.sl}>{t("dash.sleep.title")}</div>
          <div className={styles.sleepCard}>
            <div className={styles.sleepHdr}>
              <div>
                <div className={styles.wLabel}>{t("dash.sleep.total")}</div>
                <div className={styles.sleepTotal}>{minutesToHM(sleep.lastNight.totalMinutes)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className={styles.wLabel}>{t("dash.sleep.awake")}</div>
                <div className={styles.sleepEveil} style={{ color: sleep.lastNight.awakeMinutes > 120 ? "var(--red)" : "var(--yellow)" }}>
                  {minutesToHM(sleep.lastNight.awakeMinutes)}
                </div>
              </div>
            </div>
            <div className={styles.phases}>
              <SleepPhaseRow color="var(--c-3b82f6)" name={t("dash.sleep.phase.lent")} minutes={sleep.lastNight.lightMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="lent" t={t} />
              <SleepPhaseRow color="var(--c-38bdf8)" name={t("dash.sleep.phase.rem")} minutes={sleep.lastNight.remMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="rem" t={t} />
              <SleepPhaseRow color="var(--c-818cf8)" name={t("dash.sleep.phase.profond")} minutes={sleep.lastNight.deepMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="profond" t={t} />
              <SleepPhaseRow color="var(--c-ef4444)" name={t("dash.sleep.awake")} minutes={sleep.lastNight.awakeMinutes} totalMinutes={sleep.lastNight.totalMinutes} kind="eveil" t={t} />
            </div>
            {sleep.alerts.length > 0 && (
              <div className={styles.sleepAlert}>
                <span>⚠️</span>
                <span>{L(sleep.alerts[0])}</span>
              </div>
            )}
          </div>

          {/* TENDANCE */}
          <div className={styles.trendCard}>
            <div className={styles.trendTitle}>{t("dash.trend.title")}</div>
            <div>
              {sleep.nights.map((n, i) => {
                const isToday = i === sleep.nights.length - 1;
                return (
                  <div key={n.label} className={cx(styles.tr, isToday && styles.trToday)}>
                    <span className={styles.trDate} style={{ color: isToday ? "var(--g)" : "var(--m)" }}>
                      {L(n.label)}
                      {isToday ? " ★" : ""}
                    </span>
                    <span className={styles.trTotal}>{minutesToHM(n.totalMinutes)}</span>
                    <span className={styles.trEveil} style={{ color: trendColor(n.awakeMinutes, "eveil") }}>
                      {minutesToHM(n.awakeMinutes)}
                    </span>
                    <span className={styles.trProfond} style={{ color: trendColor(n.deepMinutes, "profond") }}>
                      {t("dash.trend.deep", { time: minutesToHM(n.deepMinutes) })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ALERTES */}
          {alerts.length > 0 && (
            <>
              <div className={styles.sl}>{t("dash.alerts.title")}</div>
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
          <div className={styles.sl}>{t("dash.stack.title")}</div>
          <StackGroup label={t("dash.stack.morning")} items={stack[0].items} L={L} />
          <StackGroup label={t("dash.stack.noon")} items={stack[1].items} L={L} />
          <StackGroup label={t("dash.stack.pre")} items={stack[2].items} L={L} />
          <StackGroup label={t("dash.stack.evening")} items={stack[3].items} L={L} />

          {/* EN-CAS */}
          <div className={styles.sl}>{t("dash.snack.title")}</div>
          <div className={styles.snackCard}>
            <div className={styles.snackTitle}>{L(snack.titre)}</div>
            <div className={styles.snackContent}>{L(snack.contenu)}</div>
            <div className={styles.snackNote}>{L(snack.note)}</div>
          </div>

          {/* ACTIVITÉ DU JOUR — titre de section (doc H.2), bloc "Prévu aujourd'hui" inchangé */}
          {competitionPlan && (
            <CompetitionCard
              plan={competitionPlan}
              hyroxPrep={hyroxPrep}
              categorie={competitionPlan.categorie}
              niveauVise={competitionPlan.niveauVise}
              objectifTemps={objectifsOf(profile).find((o) => o.event === competitionPlan.event)?.fiche.objectifTemps}
              weekDays={weekDaysForCard}
              loads={competitionPlan.event === "Hyrox" ? loadsLine(profile?.genre, competitionPlan.categorie) : undefined}
              lang={lang}
            />
          )}
          <ActivitySectionTitle />
          {doneExtrasBeforePrimary.map((a) => (
            <div key={a.id} style={{ marginBottom: 10 }}>
              <ActivityCard data={a.card} showPlus={false} />
            </div>
          ))}

          {/* SÉANCE DU JOUR — contenu selon le check-in, structure identique */}
          {finishedSession ? (
            <ActivityCard data={mainCard} showPlus={doneExtrasAfterPrimary.length === 0} />
          ) : adviceSession?.repos || (!adviceSession && isRestDay) ? (
            <ActivityCard data={restCard} showPlus={doneExtrasBeforePrimary.length === 0 && doneExtrasAfterPrimary.length === 0 && notDoneExtras.length === 0} />
          ) : adviceSession ? (
            <div className={styles.upcomingCard}>
              <div className={styles.upcomingHead}>
                <div className={styles.l}>
                  <span>⏳</span>
                  <span className={styles.txt}>{adviceSession.repos ? t("dash.upcoming.activeRest") : t("dash.upcoming.today")}</span>
                </div>
              </div>
              <div className={styles.upcomingSub}>
                <span>{adviceSession.emoji || (adviceSession.repos ? "🛌" : "🥊")}</span>
                <span className={styles.name}>
                  {adviceSession.titre} · {adviceSession.dureeEstimee} · {blocksLabel(adviceSession.blocks.length)}
                </span>
              </div>
              <div className={styles.upcomingNote}>{t("dash.upcoming.notDone")}</div>
              <SessionPreviewToggle
                startHref="/session"
                programTitle={adviceSession.titre}
                subtitle={adviceSession.repos ? "EL COACH METHOD" : t("dash.upcoming.offProgram")}
                summaryIcon={adviceSession.emoji || (adviceSession.repos ? "🛌" : "🥊")}
                summaryTitle={adviceSession.titre}
                summaryLine={`${adviceSession.dureeEstimee} · ${blocksLabel(adviceSession.blocks.length)} · ${t("dash.upcoming.notDone").toLowerCase()}`}
                durationLabel={adviceSession.dureeEstimee}
              >
                <ApercuCards cards={blocksToApercuCards(adviceSession.blocks)} />
              </SessionPreviewToggle>
            </div>
          ) : (
            <div className={styles.upcomingCard}>
              <div className={styles.upcomingHead}>
                <div className={styles.l}>
                  <span>⏳</span>
                  <span className={styles.txt}>{t("dash.upcoming.today")}</span>
                </div>
              </div>
              <div className={styles.upcomingSub}>
                <span>⚡</span>
                <span className={styles.name}>
                  {tc(lang, baseDay.focus)} · {minutesToHM(baseDay.estimatedMinutes)} · {blocksLabel(baseDay.blocks.length)}
                </span>
              </div>
              <div className={styles.upcomingNote}>{t("dash.upcoming.notDone")}</div>
              <SessionPreviewToggle
                startHref={`/session?variant=${variant.recommended === "A" ? "a" : "b"}&v=${modular.variant}${seq?.manual ? `&d=${seq.dayNumber}` : ""}`}
                programTitle={today.template.name}
                subtitle="EL COACH METHOD"
                summaryIcon="⚡"
                summaryTitle={tc(lang, baseDay.focus)}
                summaryLine={`${minutesToHM(baseDay.estimatedMinutes)} · ${blocksLabel(baseDay.blocks.length)} · ${t("dash.upcoming.notDone").toLowerCase()}`}
                durationLabel={minutesToHM(safeDay.estimatedMinutes)}
              >
                <div
                  style={{
                    background: "var(--s)",
                    border: "1px solid var(--bd)",
                    borderRadius: 4,
                    padding: "9px 13px",
                    marginBottom: 10,
                    fontSize: 11,
                    color: "var(--m)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <span>▶️</span>
                  <span>{t("dash.videoHint")}</span>
                </div>
                {activeBlock && (
                  <div className={styles.modularPicker}>
                    <div className={styles.modularTitle}>
                      {t("dash.block.title", { theme: themeLabel(programSlug, activeBlock.theme, t), week: activeBlock.info.week, weeks: activeBlock.info.weeks })}
                      {activeBlock.info.isDeload && <span className={styles.modularWhy}>{t("dash.block.deload")}</span>}
                    </div>
                    {activeBlock.info.finished && (
                      <Link href="/profile/theme" className={styles.modularBtn}>
                        <span>{t("dash.block.finished")}</span>
                      </Link>
                    )}
                  </div>
                )}
                {seq && seq.sequence.length > 1 && (
                  <details className={styles.modularPicker}>
                    <summary className={styles.modularTitle}>
                      {t("dash.seq.title", { n: (seq.position % seq.sequence.length) + 1, total: seq.sequence.length })}
                    </summary>
                    <div className={styles.modularRow}>
                      {Array.from(new Set(seq.sequence)).map((n) => {
                        const d = today.template.weeks[0].days.find((x) => x.day === n);
                        if (!d) return null;
                        return (
                          <Link key={n} href={`/dashboard?d=${n}`} replace scroll={false} className={cx(styles.modularBtn, seq.dayNumber === n && styles.modularBtnOn)}>
                            <span>{tc(lang, d.focus)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                )}
                {baseDay.blocks.length >= 4 && (
                  <div className={styles.modularPicker}>
                    <div className={styles.modularTitle}>
                      {t("dash.format.title")}
                      {modular.suggestion.reasons.length > 0 && (
                        <span className={styles.modularWhy}>{t("dash.format.suggested", { reasons: modular.suggestion.reasons.join(", ") })}</span>
                      )}
                    </div>
                    <div className={styles.modularRow}>
                      {(["complete", "nofinisher", "short"] as ModularVariant[]).map((v) => (
                        <Link
                          key={v}
                          href={`/dashboard?v=${v}${seq?.manual ? `&d=${seq.dayNumber}` : ""}`}
                          replace
                          scroll={false}
                          className={cx(styles.modularBtn, modular.variant === v && styles.modularBtnOn)}
                        >
                          <span>{variantLabel(v, t)}</span>
                          <small>{variantHint(v, t)}</small>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <SessionTabs
                  recommended={variant.recommended === "A" ? "a" : "b"}
                  recoText={t("dash.tabs.reco", { v: variant.recommended, reason: variant.reason })}
                  labelA={t("dash.tabs.labelA")}
                  labelB={t("dash.tabs.labelB")}
                  subA={t("dash.tabs.subA")}
                  subB={t("dash.tabs.subB")}
                  panelA={<ApercuCards cards={blocksToApercuCards(toDisplayBlocks(safeDay.blocks, t), "a-")} />}
                  panelB={<ApercuCards cards={blocksToApercuCards(toDisplayBlocks(lightDay.blocks, t), "b-")} />}
                />
              </SessionPreviewToggle>
            </div>
          )}

          {/* ACTIVITÉS TERMINÉES PLUS TARD QUE LA SÉANCE PRINCIPALE */}
          {doneExtrasAfterPrimary.map((a, i) => (
            <div key={a.id} style={{ marginTop: 10 }}>
              <ActivityCard data={a.card} showPlus={i === doneExtrasAfterPrimary.length - 1} />
            </div>
          ))}

          {/* ACTIVITÉS SUPPLÉMENTAIRES PAS ENCORE TERMINÉES */}
          {notDoneExtras.map((a) => (
            <div key={a.id} className={styles.upcomingCard}>
              <div className={styles.upcomingHead}>
                <div className={styles.l}>
                  <span>⏳</span>
                  <span className={styles.txt}>{t("dash.second.title")}</span>
                </div>
              </div>
              <div className={styles.upcomingSub}>
                <span>{a.icon}</span>
                <span className={styles.name}>{a.seanceLabel}</span>
              </div>
              <div className={styles.upcomingCtaRow}>
                <Link href={`/session/extra/${a.id}`} className={styles.upcomingStartBtn} style={{ flex: 1 }}>
                  {t("dash.second.resume")}
                </Link>
              </div>
            </div>
          ))}

          {extraActivityCards.length > 0 && (
            <div className={styles.multiActivityNote}>
              {t("dash.multi", { n: extraActivityCards.length + 1 })}
            </div>
          )}
          {!(finishedSession || adviceSession?.repos || (!adviceSession && isRestDay)) || notDoneExtras.length > 0 ? <AddActivityLink /> : null}

          {/* DEMAIN */}
          {tomorrowCards && <TomorrowSection title={t("tomorrow.title")} cards={tomorrowCards} />}

          <div className={styles.spacer} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: Translate }) {
  return (
    <section className={`relative mx-auto max-w-3xl px-6 py-24 text-center ${dashboardFontVariables}`}>
      <BackHomeButton label={t("dash.back")} style={{ position: "absolute", top: 16, left: 16 }} />
      <div className="label">{t("dash.label")}</div>
      <h1 className="mt-4 text-4xl font-semibold" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: 1 }}>
        {t("dash.empty.title")}
      </h1>
      <p className="mt-4 text-[color:var(--color-mute)]">{t("dash.empty.text")}</p>
      <Link href="/onboarding" className="btn-primary mt-8 inline-flex">
        {t("dash.empty.cta")}
      </Link>
    </section>
  );
}

function CheckinPendingState({
  userFirstName,
  everCheckedIn,
  t,
}: {
  userFirstName: string | null;
  everCheckedIn: boolean;
  t: Translate;
}) {
  const salut = userFirstName ? t("dash.hello", { name: userFirstName }) : t("dash.helloAnon");
  return (
    <section className={`relative mx-auto max-w-3xl px-6 py-24 text-center ${dashboardFontVariables}`}>
      <BackHomeButton label={t("dash.back")} style={{ position: "absolute", top: 16, left: 16 }} />
      <div className="label">{t("dash.label")}</div>
      <h1 className="mt-4 text-4xl font-semibold" style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: 1 }}>
        {salut}
      </h1>
      <p className="mt-4 text-[color:var(--color-mute)]">{everCheckedIn ? t("dash.pending.noPlan") : t("dash.pending.first")}</p>
      <Link href="/checkin" className="btn-gold mt-8 inline-flex">
        {everCheckedIn ? t("dash.pending.ctaNow") : t("dash.pending.ctaFirst")}
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
  t,
}: {
  color: string;
  name: string;
  minutes: number;
  totalMinutes: number;
  kind: "lent" | "rem" | "profond" | "eveil";
  t: Translate;
}) {
  const { badge, cls } = sleepPhaseBadge(minutes, kind, t);
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

function StackGroup({ label, items, L }: { label: string; items: { name: string; dose?: string; active: boolean; note?: string }[]; L: (text: string) => string }) {
  return (
    <>
      <div className={styles.sm}>{label}</div>
      <div className={styles.sg}>
        {items.map((it) => {
          const emoji = STACK_EMOJI[it.name] ?? "•";
          const type = !it.active ? "pillOff" : it.note ? "pillKey" : "pillOn";
          return (
            <div key={it.name} className={cx(styles.pill, styles[type])}>
              {emoji} {L(it.name)}
              {it.dose ? ` · ${L(it.dose)}` : ""}
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

/** Repli quand la semaine type n'est pas renseignée : le programme fixe hebdomadaire. */
