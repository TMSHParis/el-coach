// Quelles notifications envoyer à un utilisateur à un instant donné (partie 5, mission 4A). Pur, testable :
// la tâche planifiée (run.ts) lit les données, appelle `planNotifications`, déduplique et envoie.

import { makeT } from "../i18n";
import type { Lang } from "../i18n/lang";
import { daysBetween, isQuiet, localParts, parseClock } from "./time";
import { fmtDurationH } from "../recap-text";

/** Paramètres de départ (modifiables). */
export const CHECKIN_WINDOW_MIN = 90;
export const SEANCE_LEAD_MIN = 30;
export const INJURY_AFTER_DAYS = 5;
export const INJURY_SEND_FROM_MIN = 9 * 60;
export const RECAP_WINDOW_MIN = 90;
export const DEFAULT_CHECKIN_TIME = "07:00";
export const DEFAULT_RECAP_TIME = "19:00";
/** Plafond par jour et par utilisateur, tous types confondus. */
export const DAILY_CAP = 3;
/** Une séance démarrée dans l'heure qui précède un créneau (ou après) compte comme « ce créneau est déjà commencé ». */
export const SEANCE_STARTED_LOOKBACK_MIN = 60;
/** Ordre de conservation au-delà du plafond : le récapitulatif saute en premier, le rappel check-in en dernier. */
export const KEEP_PRIORITY: NotifKind[] = ["checkin", "seance", "injury", "recap"];

export type NotifKind = "checkin" | "seance" | "injury" | "recap";

export type NotifPrefs = {
  checkinOn: boolean;
  checkinTime: string | null;
  /** Ancienne heure, conservée jusqu'à `checkinFrom` (le changement s'applique le lendemain). */
  checkinPrev: string | null;
  checkinFrom: string | null;
  seanceOn: boolean;
  blessureOn: boolean;
  recapOn: boolean;
  recapTime: string | null;
};

export type NotifContext = {
  checkinDone: boolean;
  /** Créneaux d'aujourd'hui (semaine enregistrée) ; vide un jour de repos. */
  slots: { sport: string; heure: string }[];
  /** Minutes (heure locale) auxquelles une séance a été démarrée aujourd'hui. */
  startsToday: number[];
  /** Zone signalée, telle que saisie, et premier jour de la période active. */
  injury: { zone: string; startKey: string; lastKey: string } | null;
  week: { count: number; totalSec: number; best: { name: string; pct: number } | null };
};

export type Planned = { kind: NotifKind; key: string; title: string; body: string; url: string };

/** Heure du rappel check-in effective à `dateKey` : l'ancienne heure jusqu'au lendemain d'un changement. */
export function effectiveCheckinTime(p: NotifPrefs, dateKey: string): string {
  const current = p.checkinTime || DEFAULT_CHECKIN_TIME;
  if (p.checkinFrom && p.checkinPrev && dateKey < p.checkinFrom) return p.checkinPrev;
  return current;
}

const stripIcon = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();

export function planNotifications(input: {
  lang: Lang;
  tz: string;
  prefs: NotifPrefs;
  ctx: NotifContext;
  now: Date;
}): Planned[] {
  const { lang, tz, prefs, ctx, now } = input;
  const t = makeT(lang);
  const { dateKey, minutes, weekday } = localParts(now, tz);
  const out: Planned[] = [];

  // a) Rappel check-in : seulement si le check-in du jour n'est pas fait. Autorisé dans la plage
  // silencieuse uniquement si l'utilisateur a lui-même choisi cette heure.
  if (prefs.checkinOn && !ctx.checkinDone) {
    const at = parseClock(effectiveCheckinTime(prefs, dateKey));
    if (at !== null && minutes >= at && minutes < at + CHECKIN_WINDOW_MIN && (!isQuiet(minutes) || isQuiet(at))) {
      out.push({ kind: "checkin", key: dateKey, title: t("notif.title.checkin"), body: t("notif.checkin"), url: "/checkin" });
    }
  }

  // c) Rappel séance : 30 min avant chaque créneau d'aujourd'hui qui a une heure ; rien un jour de repos.
  if (prefs.seanceOn && !isQuiet(minutes)) {
    ctx.slots.forEach((s, i) => {
      const at = parseClock(s.heure);
      if (at === null || !s.sport) return;
      const target = at - SEANCE_LEAD_MIN;
      const started = ctx.startsToday.some((m) => m >= at - SEANCE_STARTED_LOOKBACK_MIN && m <= minutes);
      if (minutes >= target && minutes < at && !started) {
        out.push({
          kind: "seance",
          key: `${dateKey}:${i}`,
          title: t("notif.title.seance"),
          body: t("notif.seance", { name: stripIcon(s.sport), time: s.heure.trim() }),
          url: "/dashboard",
        });
      }
    });
  }

  // d) Alerte blessure : zone signalée active depuis plus de 5 jours, un seul rappel par zone et par période.
  if (prefs.blessureOn && ctx.injury && !isQuiet(minutes) && minutes >= INJURY_SEND_FROM_MIN) {
    const { zone, startKey, lastKey } = ctx.injury;
    if (daysBetween(startKey, lastKey) > INJURY_AFTER_DAYS && daysBetween(lastKey, dateKey) <= 2) {
      const norm = zone.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
      out.push({ kind: "injury", key: `${norm}:${startKey}`, title: t("notif.title.injury"), body: t("notif.injury", { zone }), url: "/profile/edit" });
    }
  }

  // e) Récapitulatif : dimanche à l'heure du récap, uniquement avec les données enregistrées.
  if (prefs.recapOn && weekday === 0 && !isQuiet(minutes)) {
    const at = parseClock(prefs.recapTime || DEFAULT_RECAP_TIME);
    if (at !== null && minutes >= at && minutes < at + RECAP_WINDOW_MIN) {
      const { count, totalSec, best } = ctx.week;
      let body: string;
      if (count === 0) body = t("notif.recap.none");
      else {
        const parts = [t("notif.recap.line", { count: t(count === 1 ? "notif.recap.count.one" : "notif.recap.count.many", { n: count }) })];
        if (totalSec > 0) parts[0] += `, ${t("notif.recap.duration", { duration: fmtDurationH(totalSec) })}`;
        parts[0] += ".";
        if (best) parts.push(t("notif.recap.best", { name: best.name, pct: best.pct }));
        body = parts.join(" ");
      }
      out.push({ kind: "recap", key: dateKey, title: t("notif.title.recap"), body, url: "/progress" });
    }
  }
  return out;
}

/** Garde au plus `DAILY_CAP - alreadySent` notifications, en abandonnant d'abord les moins importantes. */
export function withinDailyCap(planned: Planned[], alreadySent: number): Planned[] {
  const room = Math.max(0, DAILY_CAP - alreadySent);
  if (planned.length <= room) return planned;
  const ranked = [...planned].sort((a, b) => KEEP_PRIORITY.indexOf(a.kind) - KEEP_PRIORITY.indexOf(b.kind));
  return ranked.slice(0, room);
}
