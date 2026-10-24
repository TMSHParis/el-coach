// Mode compétition (partie 3) : familles d'événements, fiche par sport, phases et
// table sport -> programme. Tout est PARAMÈTRE modifiable sans toucher à la logique.
// « source » = information lue dans le document ; « proposition » = valeur de départ
// non sourcée, à valider par un coach.

import { makeT, type Translate } from "@/lib/i18n";
import { dv } from "@/app/signup/display";

export type EventFamilyId = "course" | "hybride" | "combat" | "autre";

export const EVENT_FAMILIES: { id: EventFamilyId; label: string; sports: string[] }[] = [
  { id: "course", label: "Course", sports: ["Marathon", "Semi-Marathon", "Trail"] },
  { id: "hybride", label: "Hybride", sports: ["Hyrox", "CrossFit Games", "Spartan / OCR", "Triathlon"] },
  { id: "combat", label: "Combat", sports: ["Combat Boxe", "Combat Muay Thai", "Combat MMA", "Compétition Jiu-Jitsu"] },
  { id: "autre", label: "Autre", sports: ["Autre"] },
];

export const EVENT_ICONS: Record<string, string> = {
  Marathon: "🏃",
  "Semi-Marathon": "🏃",
  Trail: "⛷️",
  Hyrox: "🏁",
  "CrossFit Games": "⚡",
  "Combat Boxe": "🥊",
  "Combat Muay Thai": "🥋",
  "Combat MMA": "🥋",
  "Compétition Jiu-Jitsu": "🥋",
  Triathlon: "🏊",
  "Spartan / OCR": "🏔️",
  Autre: "✏️",
};

/** Libellé affiché d'une famille d'événements (l'identifiant reste inchangé). */
export function familyLabel(id: EventFamilyId, t: Translate = makeT("fr")): string {
  return t(`su.fam.${id}`);
}

/** Nom d'un événement pour l'affichage ; la valeur enregistrée (« Hyrox », « Combat Boxe »…) ne change pas. */
export function eventLabel(event: string, t: Translate = makeT("fr")): string {
  return dv(t, event);
}

/** Libellé d'un champ, d'une option, d'une catégorie ou d'une note de fiche (valeur stockée inchangée). */
export function ficheText(text: string, t: Translate = makeT("fr")): string {
  return dv(t, text);
}

export function familyOf(event: string): EventFamilyId {
  return EVENT_FAMILIES.find((f) => f.sports.includes(event))?.id ?? "autre";
}

/** Nom court affiché en grand sur la fiche (les libellés d'origine ne changent pas ailleurs). */
export function sportTitle(event: string, t: Translate = makeT("fr")): string {
  return dv(t, event.replace(/^Combat /, "").replace(/^Compétition /, ""));
}

export const HYROX_CATEGORIES = ["Open · Solo", "Open · Doubles", "Pro · Solo", "Pro · Doubles"];

/** Catégories de poids de la boxe, seniors (source : FFBoxe, Tournoi national Novices 2025). */
export const BOXE_WEIGHT_CLASSES = [
  "Hommes 46-48 kg",
  "Hommes 51 kg",
  "Hommes 54 kg",
  "Hommes 57 kg",
  "Hommes 60 kg",
  "Hommes 63,5 kg",
  "Hommes 67 kg",
  "Hommes 71 kg",
  "Hommes 75 kg",
  "Hommes 80 kg",
  "Hommes 86 kg",
  "Hommes 92 kg",
  "Hommes +92 kg",
  "Femmes 45-48 kg",
  "Femmes 50 kg",
  "Femmes 52 kg",
  "Femmes 54 kg",
  "Femmes 57 kg",
  "Femmes 60 kg",
  "Femmes 63 kg",
  "Femmes 66 kg",
  "Femmes 70 kg",
  "Femmes 75 kg",
  "Femmes 81 kg",
  "Femmes +81 kg",
];

/** Saison CrossFit : mise à jour chaque saison depuis les annonces officielles. Saison 2026 = source CrossFit ; 2027 non connue. */
export const CROSSFIT_CALENDAR: { etape: string; debut: string; fin: string }[] = [
  { etape: "Open", debut: "2026-02-26", fin: "2026-03-16" },
  { etape: "Quarterfinals", debut: "2026-03-26", fin: "2026-03-30" },
  { etape: "Semifinals", debut: "2026-04-01", fin: "2026-06-30" },
  { etape: "Games", debut: "2026-07-24", fin: "2026-07-26" },
];

/** Date de l'étape visée si elle est encore à venir d'après le calendrier ; sinon null (saisie libre). */
export function crossfitStageDate(etape: string, todayKey: string): string | null {
  const row = CROSSFIT_CALENDAR.find((r) => r.etape === etape);
  return row && row.debut > todayKey ? row.debut : null;
}

// ---------------------------------------------------------------------------
// Champs de la fiche d'un sport
// ---------------------------------------------------------------------------

export type FicheField = {
  /** "date" -> dateExacte, "niveau" -> priorite, "categorie" -> categorie (Hyrox) ; sinon fiche[key]. */
  key: string;
  label: string;
  kind: "date" | "text" | "number" | "choice" | "yesno";
  options?: string[];
  optional?: boolean;
  placeholder?: string;
  unit?: string;
};

const DATE_COURSE: FicheField = { key: "date", label: "Date exacte de la course", kind: "date" };
const niveau = (options: string[]): FicheField => ({ key: "niveau", label: "Niveau visé", kind: "choice", options });
const TEMPS: FicheField = { key: "objectifTemps", label: "Objectif de temps (facultatif)", kind: "text", optional: true, placeholder: "ex. 3h45" };

export const FICHE_FIELDS: Record<string, FicheField[]> = {
  Marathon: [
    DATE_COURSE,
    TEMPS,
    niveau(["Finir", "Performer"]),
    { key: "dixKm", label: "Peux-tu courir 10 km sans t'arrêter ?", kind: "yesno" },
  ],
  "Semi-Marathon": [DATE_COURSE, TEMPS, niveau(["Finir", "Performer"])],
  Trail: [
    DATE_COURSE,
    { key: "distance", label: "Distance", kind: "number", unit: "km" },
    { key: "denivele", label: "Dénivelé positif", kind: "number", unit: "m" },
    niveau(["Finir", "Performer"]),
  ],
  Hyrox: [
    { key: "date", label: "Date exacte de la course", kind: "date" },
    { key: "categorie", label: "Catégorie", kind: "choice", options: HYROX_CATEGORIES },
    niveau(["Finir", "Performer", "Podium"]),
  ],
  "CrossFit Games": [
    { key: "etape", label: "Étape visée", kind: "choice", options: ["Open", "Quarterfinals", "Semifinals", "Games"] },
    { key: "date", label: "Date de l'étape", kind: "date" },
    { key: "division", label: "Division", kind: "choice", options: ["Individuel", "Équipe", "Catégorie d'âge"] },
    niveau(["Finir", "Performer", "Podium"]),
  ],
  "Spartan / OCR": [
    DATE_COURSE,
    { key: "format", label: "Format", kind: "choice", options: ["Sprint", "Super", "Beast", "Autre"] },
    niveau(["Finir", "Performer", "Podium"]),
  ],
  Triathlon: [
    DATE_COURSE,
    { key: "format", label: "Format", kind: "choice", options: ["Sprint", "Olympique", "70.3", "Ironman"] },
    niveau(["Finir", "Performer", "Podium"]),
  ],
  "Combat Boxe": [
    { key: "date", label: "Date du combat", kind: "date" },
    { key: "poids", label: "Catégorie de poids", kind: "choice", options: BOXE_WEIGHT_CLASSES },
    { key: "formatRounds", label: "Format", kind: "choice", options: ["3 × 3 min (seniors)", "Autre"] },
    niveau(["Loisir", "Amateur", "Élite"]),
  ],
  "Combat Muay Thai": [
    { key: "date", label: "Date du combat", kind: "date" },
    { key: "poids", label: "Catégorie de poids", kind: "text" },
    { key: "formatRounds", label: "Format des rounds", kind: "text" },
    niveau(["Loisir", "Amateur", "Élite"]),
  ],
  "Combat MMA": [
    { key: "date", label: "Date du combat", kind: "date" },
    { key: "poids", label: "Catégorie de poids", kind: "text" },
    { key: "formatRounds", label: "Format des rounds", kind: "text" },
    niveau(["Loisir", "Amateur", "Élite"]),
  ],
  "Compétition Jiu-Jitsu": [
    { key: "date", label: "Date de la compétition", kind: "date" },
    { key: "ceinture", label: "Ceinture", kind: "choice", options: ["Blanche", "Bleue", "Violette", "Marron", "Noire"] },
    { key: "gi", label: "Gi ou no-gi", kind: "choice", options: ["Gi", "No-gi"] },
    { key: "poids", label: "Catégorie de poids", kind: "text" },
    niveau(["Loisir", "Amateur", "Élite"]),
  ],
  Autre: [
    { key: "nom", label: "Nom de l'événement", kind: "text", placeholder: "Décris ton événement..." },
    { key: "date", label: "Date exacte", kind: "date" },
    niveau(["Finir", "Performer", "Podium"]),
  ],
};

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export type PhaseKey = "base" | "specifique" | "affutage" | "evenement";

/** Noms des phases selon la famille (4.1). Hyrox : dernière phase « Course ». */
export const PHASE_NAMES: Record<EventFamilyId, Record<PhaseKey, string>> = {
  course: { base: "Base", specifique: "Spécifique", affutage: "Affûtage", evenement: "Course" },
  hybride: { base: "Construction", specifique: "Spécifique", affutage: "Affûtage", evenement: "Événement" },
  combat: { base: "Préparation générale", specifique: "Spécifique", affutage: "Camp et affûtage", evenement: "Combat" },
  autre: { base: "Préparation générale", specifique: "Spécifique", affutage: "Affûtage", evenement: "Événement" },
};

export function phaseNames(event: string, t: Translate = makeT("fr")): Record<PhaseKey, string> {
  const names = PHASE_NAMES[familyOf(event)];
  const base = event === "Hyrox" ? { ...names, evenement: "Course" } : names;
  return {
    base: dv(t, base.base),
    specifique: dv(t, base.specifique),
    affutage: dv(t, base.affutage),
    evenement: dv(t, base.evenement),
  };
}

export type PhaseParams = {
  /** Durée conseillée totale de préparation (semaines), affûtage compris. */
  total: number;
  specifique: number;
  affutage: number;
  /** Fraction du volume normal selon le nombre de semaines avant l'événement (0 = semaine de l'événement). */
  volume: Record<number, number>;
};

/** Défaut sûr pour un sport sans durée sourcée (à fixer par un coach). */
const GENERIC: PhaseParams = { total: 12, specifique: 4, affutage: 2, volume: { 2: 0.8, 1: 0.6, 0: 0.5 } };

/**
 * Durées de départ. Sourcés : marathon 12 / 16 semaines (Marathon Handbook), affûtage marathon 3 semaines
 * (The Mother Runners), semi 10 semaines et affûtage 2 semaines (Campus Coach), trail court 12 semaines
 * (Raidlight), 70.3 14 semaines et affûtage 2 semaines (TrainingPeaks), affûtage CrossFit environ 7 jours
 * (Pritchard 2020). Le reste = proposition, à valider par un coach.
 */
export function phaseParamsFor(event: string, fiche: Record<string, string> = {}): PhaseParams {
  switch (event) {
    case "Marathon": {
      const base = fiche.dixKm === "non";
      return { total: base ? 16 : 12, specifique: base ? 6 : 5, affutage: 3, volume: { 3: 0.87, 2: 0.65, 1: 0.55, 0: 0.5 } };
    }
    case "Semi-Marathon":
      return { total: 10, specifique: 4, affutage: 2, volume: { 2: 0.8, 1: 0.6, 0: 0.5 } };
    case "Trail": {
      const km = parseFloat(fiche.distance ?? "");
      if (km > 80) return { total: 20, specifique: 6, affutage: 3, volume: { 3: 0.5, 2: 0.3, 1: 0.2, 0: 0.15 } };
      if (km > 42) return { total: 16, specifique: 5, affutage: 2, volume: { 2: 0.7, 1: 0.5, 0: 0.4 } };
      return { total: 12, specifique: 4, affutage: 2, volume: { 2: 0.8, 1: 0.6, 0: 0.5 } };
    }
    case "Hyrox":
      return { total: 16, specifique: 4, affutage: 4, volume: { 4: 0.8, 3: 0.8, 2: 0.55, 1: 0.55, 0: 0.5 } };
    case "CrossFit Games":
      return { total: 12, specifique: 4, affutage: 1, volume: { 1: 0.6, 0: 0.5 } };
    case "Spartan / OCR":
      return { total: 12, specifique: 4, affutage: 1, volume: { 1: 0.7, 0: 0.5 } };
    case "Triathlon": {
      const f = fiche.format;
      if (f === "Ironman") return { total: 24, specifique: 8, affutage: 3, volume: { 3: 0.8, 2: 0.6, 1: 0.5, 0: 0.4 } };
      if (f === "70.3") return { total: 14, specifique: 5, affutage: 2, volume: { 2: 0.6, 1: 0.5, 0: 0.4 } };
      if (f === "Olympique") return { total: 12, specifique: 4, affutage: 1, volume: { 1: 0.6, 0: 0.5 } };
      return { total: 10, specifique: 4, affutage: 1, volume: { 1: 0.6, 0: 0.5 } };
    }
    case "Combat Boxe":
    case "Combat Muay Thai":
    case "Combat MMA":
    case "Compétition Jiu-Jitsu":
      // Seule la dernière semaine à charge réduite est appuyée par l'étude (Uddin, Tallent, Waldron).
      return { total: 12, specifique: 4, affutage: 3, volume: { 3: 0.9, 2: 0.8, 1: 0.6, 0: 0.5 } };
    default:
      return GENERIC;
  }
}

// ---------------------------------------------------------------------------
// Table sport -> programme conseillé et thème (coach, modifiable sans code)
// ---------------------------------------------------------------------------

export type SportProgram = {
  /** Libellé du programme ECM, ou null quand aucun programme n'est imposé. */
  program: string | null;
  theme: string | null;
  /** Mode compétition : les thèmes Force, Endurance, Capacité, Haltérophilie ne s'appliquent plus. */
  competitionMode?: boolean;
  /** Texte de la carte quand aucun programme n'est imposé. */
  note?: string;
};

export const SPORT_PROGRAM: Record<string, SportProgram> = {
  Marathon: { program: "Hybrid Engine", theme: "Endurance" },
  "Semi-Marathon": { program: "Hybrid Engine", theme: "Endurance" },
  Trail: { program: "Hybrid Engine", theme: "Endurance" },
  Hyrox: { program: "Hyrox Pure", theme: "Compétition", competitionMode: true },
  "CrossFit Games": { program: "CrossFit Pure", theme: "Compétition", competitionMode: true },
  "Spartan / OCR": { program: "Hyrox Pure", theme: null, note: "Thème à valider par un coach." },
  Triathlon: { program: "Hybrid Engine", theme: "Endurance" },
  "Combat Boxe": { program: null, theme: null, note: "Aucun programme ECM imposé : à définir avec un coach." },
  "Combat Muay Thai": { program: null, theme: null, note: "Aucun programme ECM imposé : à définir avec un coach." },
  "Combat MMA": { program: null, theme: null, note: "Aucun programme ECM imposé : à définir avec un coach." },
  "Compétition Jiu-Jitsu": { program: null, theme: null, note: "Aucun programme ECM imposé : à définir avec un coach." },
  Autre: { program: null, theme: null, note: "Choisis un programme ECM dans la liste." },
};

export const COMPETITION_BLOCKED_THEMES = ["Force", "Endurance", "Capacité", "Haltérophilie"];

/** Sports dont l'entraînement hors ECM se place comme « autre sport » (7). */
export const EXTERNAL_SPORT_EVENTS = ["Combat Boxe", "Combat Muay Thai", "Combat MMA", "Compétition Jiu-Jitsu", "Triathlon"];

/** Mois d'un événement approximé depuis une ancienne valeur « Dans 3 mois » (aujourd'hui + durée). */
export function legacyDeadlineToDate(deadline: string, todayKey: string): string | null {
  const m = deadline.match(/^Dans (\d+) (mois|an)/);
  if (!m) return null;
  const n = Number(m[1]);
  const [y, mo, d] = todayKey.split("-").map(Number);
  const date = new Date(y, mo - 1 + (m[2] === "an" ? n * 12 : n), d);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
