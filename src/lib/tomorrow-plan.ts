import "server-only";
// Section « Demain » du dashboard (partie 5, mission 1). Source UNIQUE : la semaine enregistrée dans le
// profil, lue pour la date de demain (modification ponctuelle > alternance A/B > semaine type).
// La section ne décide jamais de la séance de demain : l'adaptation se fait au check-in de demain matin.

import { prisma } from "./prisma";
import { dateKey } from "./date-key";
import { effectiveWeekCycle } from "./week-overrides";
import { WEEK_DAYS, isEmptyCycle } from "./week-cycle";
import { buildCheckinPlan } from "./checkin-plan";
import { SPORT_LABEL_TO_SLUG } from "./ecm-programs";
import { getTemplate } from "./programming";
import { tc } from "./i18n/content";
import { nextPositionAfter, pickFromSequence, sequenceFor, sessionsPerWeek } from "./program-sequence";
import { fmtDurationH } from "./recap-text";
import { resolveProgramTips, resolveSportTips, zoneTip, TIP_MAX_CHARS } from "./tips-table";
import { makeT } from "./i18n";
import type { Lang } from "./i18n/lang";
import type { WeekCycle } from "@/app/signup/actions";

export type TomorrowTip = { key: "warmup" | "zone" | "sport"; icon: string; label: string; text: string };
export type TomorrowCard = {
  kind: "ecm" | "horsEcm" | "repos";
  icon: string;
  name: string;
  sub: string;
  heure: string;
  tips: TomorrowTip[];
};

const clamp = (s: string) => (s.length <= TIP_MAX_CHARS ? s : `${s.slice(0, TIP_MAX_CHARS - 1).trimEnd()}…`);

/** Zone signalée (profil ou check-in du jour), telle que saisie ; null si aucune. */
export function reportedZone(input: {
  profileBlessures?: boolean | null;
  profileDetail?: string | null;
  checkinDouleur?: boolean | null;
  checkinDetail?: string | null;
}): string | null {
  const fromCheckin = input.checkinDouleur ? input.checkinDetail?.trim() : "";
  const fromProfile = input.profileBlessures ? input.profileDetail?.trim() : "";
  const raw = (fromCheckin || fromProfile || "").replace(/\s+/g, " ");
  if (!raw) return null;
  // Une zone saisie très longue ferait dépasser la limite de 110 caractères du conseil.
  return raw.length > 40 ? `${raw.slice(0, 39).trimEnd()}…` : raw;
}

export async function buildTomorrow(input: {
  userId: string;
  weekCycle: unknown;
  lang: Lang;
  zone: string | null;
  /** Programme ECM terminé aujourd'hui (la suite a déjà avancé). */
  doneTodaySlug: string | null;
  today?: Date;
}): Promise<TomorrowCard[] | null> {
  const t = makeT(input.lang);
  const now = input.today ?? new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const base = input.weekCycle as WeekCycle | null;
  // Aucune semaine enregistrée dans le profil : la section n'est pas affichée.
  if (!base || isEmptyCycle(base)) return null;

  const [tomCycle, todayCycle] = await Promise.all([
    effectiveWeekCycle(input.userId, base, dateKey(tomorrow)) as Promise<WeekCycle | null>,
    effectiveWeekCycle(input.userId, base, dateKey(todayD)) as Promise<WeekCycle | null>,
  ]);
  const dayKey = WEEK_DAYS[(tomorrow.getDay() + 6) % 7];
  const todayKeyDay = WEEK_DAYS[(todayD.getDay() + 6) % 7];
  const plan = buildCheckinPlan(tomCycle, dayKey, {}, input.lang);
  if (plan.kind === "none") return null;

  if (plan.kind === "rest") {
    const tips: TomorrowTip[] = input.zone
      ? [{ key: "zone", icon: "🦵", label: t("tomorrow.tipZone"), text: clamp(zoneTip(input.zone, input.lang, true)) }]
      : [];
    return [{ kind: "repos", icon: "🛌", name: t("tomorrow.restName"), sub: t("tomorrow.restSub"), heure: "", tips }];
  }

  const positions = new Map(
    (await prisma.programPosition.findMany({ where: { userId: input.userId } })).map((r) => [r.programSlug, r.position]),
  );
  // Séances de chaque programme déjà « devant » demain : celles prévues aujourd'hui et pas encore faites,
  // puis les créneaux précédents de demain.
  const ahead = new Map<string, number>();
  for (const s of todayCycle?.[todayKeyDay]?.slots ?? []) {
    const slug = SPORT_LABEL_TO_SLUG[s.sport];
    if (slug && slug !== input.doneTodaySlug) ahead.set(slug, (ahead.get(slug) ?? 0) + 1);
  }

  const cards: TomorrowCard[] = plan.cards.map((c) => {
    const tips: TomorrowTip[] = [];
    let kind: TomorrowCard["kind"] = "horsEcm";
    let sub = "";
    let warm: string;
    let sportTip: string;
    const sportIcon = c.icon;

    const slug = c.ecm ? SPORT_LABEL_TO_SLUG[c.value] : null;
    const template = slug ? getTemplate(slug) : null;
    if (slug && template) {
      kind = "ecm";
      const days = template.weeks[0].days;
      const modelDays = days.filter((d) => d.blocks.length > 0 || d.adaptive).map((d) => d.day);
      const perWeek = sessionsPerWeek(tomCycle, slug) || modelDays.length;
      const seq = sequenceFor(slug, perWeek, modelDays);
      const offset = ahead.get(slug) ?? 0;
      // La position stockée est celle de la prochaine séance à faire ; chaque séance devant demain la décale d'un cran.
      let pos = positions.get(slug) ?? 0;
      let dayNumber = pickFromSequence(seq, pos);
      for (let i = 0; i < offset; i++) {
        pos = nextPositionAfter(seq, pos, dayNumber);
        dayNumber = pickFromSequence(seq, pos);
      }
      ahead.set(slug, offset + 1);
      const day = days.find((d) => d.day === dayNumber);
      sub = [day?.focus ? tc(input.lang, day.focus) : day?.focus, day?.estimatedMinutes ? fmtDurationH(day.estimatedMinutes * 60) : ""].filter(Boolean).join(" · ");
      const r = resolveProgramTips(slug, dayNumber, input.lang);
      warm = r.warmup;
      sportTip = r.tip;
    } else {
      sub = [t("tomorrow.nonEcm"), c.duree].filter(Boolean).join(" · ");
      const r = resolveSportTips(c.value, input.lang);
      warm = r.warmup;
      sportTip = r.tip;
    }

    tips.push({ key: "warmup", icon: "🔥", label: t("tomorrow.tipWarmup"), text: clamp(warm) });
    if (input.zone) tips.push({ key: "zone", icon: "🦵", label: t("tomorrow.tipZone"), text: clamp(zoneTip(input.zone, input.lang, false)) });
    tips.push({ key: "sport", icon: sportIcon || "💪", label: t("tomorrow.tipSport"), text: clamp(sportTip) });
    return { kind, icon: c.icon || "💪", name: c.name, sub, heure: c.heure, tips };
  });
  return cards;
}
