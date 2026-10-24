"use client";

// ============================================================================
// Composants et constantes partagés entre le flow d'inscription (onglet
// "Bienvenue" — ecm-signup-form.tsx) et le flow d'édition de profil (onglet
// "J'ai changé" — ecm-update-form.tsx). Purs, sans état externe.
// ============================================================================

import { useState, type ReactNode } from "react";
import type { EcmProfileCookie, EcmObjectifDetail, WeekCycle, WeekCycleDay, WeekCycleDayKey } from "./actions";
import { BackHomeButton } from "@/components/back-home-button";
import { standardWeekFor, standardDayToWeekCycleDay } from "@/lib/standard-week";
import styles from "./ecm-signup.module.css";
import fx from "./event-fiche.module.css";
import { EventSection } from "./event-fiche";
import { SPORT_GROUPS } from "@/lib/sports-catalog";

function emptyWeekCycle(): WeekCycle {
  const empty = (): WeekCycleDay => ({ repos: false, slots: [] });
  return { lun: empty(), mar: empty(), mer: empty(), jeu: empty(), ven: empty(), sam: empty(), dim: empty() };
}

export const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export const LEFT_PROGRAMS: { name: string; tag: string }[] = [
  { name: "CrossFit Pure", tag: "Force · Olympique · Metcon" },
  { name: "Hybrid Engine", tag: "Functional Training · Force & Cardio" },
  { name: "Hyrox Pure", tag: "Stations · Course · Compétition" },
  { name: "Volume Block Hypertrophy", tag: "Split · Volume · Progression" },
  { name: "At Home", tag: "Bodyweight · Accessible · Run" },
];

import { SPORT_LABEL_TO_SLUG, SLUG_TO_SPORT_LABEL } from "@/lib/ecm-programs";
export { SPORT_LABEL_TO_SLUG, SLUG_TO_SPORT_LABEL };
export { standardCycleFor } from "@/lib/standard-week";

export const LEVELS = ["🌱 Débutant", "📈 Intermédiaire", "🔥 Avancé", "⚡ Élite"];

type ObjectifCardConfig = {
  icon: string;
  title: string;
  subLabel: string;
  subcats: string[];
  /** Icônes affichées devant chaque option de `subcats` — carte "événement" uniquement. */
  subcatIcons?: Record<string, string>;
  deadlineLabel: string;
  deadlineOptions: string[];
  prioLabel: string;
  prioOptions: string[];
  /** Carte 6 — les options de subcats sont des événements ; "Autre" ouvre un champ texte libre. */
  isEvent?: boolean;
};

export const OBJECTIF_CARDS: ObjectifCardConfig[] = [
  {
    icon: "🔥",
    title: "Réduire la graisse corporelle",
    subLabel: "Quantité visée",
    subcats: ["Légère · -3 à -5kg", "Modérée · -5 à -10kg", "Importante · -10kg+"],
    deadlineLabel: "⏳ Deadline",
    deadlineOptions: ["3 mois", "6 mois", "1 an", "Pas de deadline"],
    prioLabel: "🎖️ Priorité",
    prioOptions: ["Esthétique", "Santé", "Performance", "Les 3"],
  },
  {
    icon: "💪",
    title: "Gagner de la masse musculaire",
    subLabel: "Progression visée",
    subcats: ["Léger · +2 à +4kg", "Modéré · +4 à +8kg", "Transformation · +8kg+"],
    deadlineLabel: "⏳ Deadline",
    deadlineOptions: ["3 mois", "6 mois", "1 an", "Pas de deadline"],
    prioLabel: "🎖️ Priorité",
    prioOptions: ["Esthétique", "Force", "Volume", "Les 3"],
  },
  {
    icon: "⚡",
    title: "Recomposition corporelle",
    subLabel: "Approche",
    subcats: ["Perdre du gras en priorité", "Gagner du muscle en priorité", "Équilibre gras / muscle"],
    deadlineLabel: "⏳ Deadline",
    deadlineOptions: ["3 mois", "6 mois", "1 an", "Pas de deadline"],
    prioLabel: "🎖️ Priorité",
    prioOptions: ["Esthétique", "Santé", "Les 2"],
  },
  {
    icon: "🏆",
    title: "Améliorer mes performances sportives",
    subLabel: "Axe de progression",
    subcats: ["💪 Force", "🫀 Cardio", "⚡ Explosivité", "🏃 Endurance", "🔄 Mobilité", "🌟 Tout"],
    deadlineLabel: "⏳ Deadline",
    deadlineOptions: ["3 mois", "6 mois", "1 an", "Pas de deadline"],
    prioLabel: "🎖️ Priorité",
    prioOptions: ["Compétition", "Loisir", "Santé"],
  },
  {
    icon: "🧘",
    title: "Bien-être général",
    subLabel: "Ce que tu veux améliorer",
    subcats: ["😴 Sommeil", "⚡ Énergie au quotidien", "🧠 Gestion du stress", "🛡️ Santé générale", "🌟 Tout"],
    deadlineLabel: "⏳ Deadline",
    deadlineOptions: ["3 mois", "6 mois", "1 an", "Pas de deadline"],
    prioLabel: "🎖️ Priorité",
    prioOptions: ["Corps", "Mental", "Les 2"],
  },
  {
    icon: "🎯",
    title: "Je prépare mon corps à...",
    subLabel: "Quel événement ?",
    subcats: [
      "Marathon",
      "Semi-Marathon",
      "Trail",
      "Hyrox",
      "CrossFit Games",
      "Combat Boxe",
      "Combat Muay Thai",
      "Combat MMA",
      "Compétition Jiu-Jitsu",
      "Triathlon",
      "Spartan / OCR",
      "Autre",
    ],
    subcatIcons: {
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
    },
    deadlineLabel: "⏳ Date de l'événement",
    deadlineOptions: ["Dans 1 mois", "Dans 3 mois", "Dans 6 mois", "Dans 1 an"],
    prioLabel: "🎖️ Niveau visé",
    prioOptions: ["Finir", "Performer", "Podium"],
    isEvent: true,
  },
];

const MAX_AXES = 3;
const AXIS_TOUT = "🌟 Tout";
const isPerfCard = (card: ObjectifCardConfig) => card.title === "Améliorer mes performances sportives";

function emptyObjectifDetail(card: ObjectifCardConfig): EcmObjectifDetail {
  return { type: `${card.icon} ${card.title}`, sousCat: "", deadline: "", priorite: "", event: "" };
}

/** Section complète "Mes objectifs" (2 max) — cartes accordéon avec sous-catégorie/deadline/priorité. */
export function ObjectifsPicker({
  values,
  onChange,
  onExceed,
  programme,
  onProgramme,
  onPickOtherProgramme,
}: {
  values: EcmObjectifDetail[];
  onChange: (next: EcmObjectifDetail[]) => void;
  onExceed: () => void;
  /** Programme principal actuel et réglage : la carte « Programme conseillé » propose, l'utilisateur confirme. */
  programme?: string;
  onProgramme?: (label: string) => void;
  onPickOtherProgramme?: () => void;
}) {
  const [axisMsg, setAxisMsg] = useState<string | null>(null);

  function patch(cardType: string, fields: Partial<EcmObjectifDetail>) {
    onChange(values.map((v) => (v.type === cardType ? { ...v, ...fields } : v)));
  }

  function toggleCard(card: ObjectifCardConfig, type: string) {
    const exists = values.some((v) => v.type === type);
    if (exists) {
      onChange(values.filter((v) => v.type !== type));
      return;
    }
    if (values.length >= 2) {
      onExceed();
      return;
    }
    onChange([...values, emptyObjectifDetail(card)]);
  }

  /** Axes de progression : 3 maximum, « Tout » exclusif, l'ordre de sélection est conservé. */
  function toggleAxis(type: string, entry: EcmObjectifDetail, axis: string) {
    const current = entry.axes ?? (entry.sousCat ? [entry.sousCat] : []);
    let next: string[];
    if (current.includes(axis)) {
      next = current.filter((a) => a !== axis);
    } else if (axis === AXIS_TOUT) {
      next = [AXIS_TOUT];
    } else {
      const base = current.filter((a) => a !== AXIS_TOUT);
      if (base.length >= MAX_AXES) {
        setAxisMsg("3 axes maximum. Retire-en un, ou choisis Tout.");
        return;
      }
      next = [...base, axis];
    }
    setAxisMsg(null);
    patch(type, { axes: next, sousCat: next[0] ?? "" });
  }

  return (
    <div className={cx(styles.qc, styles.on)}>
      <div className={styles.ql}>
        <i>🎯</i> Mes objectifs <span className={styles.hint}>(2 maximum)</span>
      </div>
      <div className={styles.objMaxInfo}>
        <span>Sélectionnés :</span>
        <span className={styles.objCounter}>{values.length}</span>
        <span>/ 2</span>
      </div>
      {OBJECTIF_CARDS.map((card) => {
        const type = `${card.icon} ${card.title}`;
        const entry = values.find((v) => v.type === type);
        const selected = Boolean(entry);
        const perf = isPerfCard(card);
        const competition = perf && entry?.priorite === "Compétition";
        const axes = entry ? entry.axes ?? (entry.sousCat ? [entry.sousCat] : []) : [];
        const full = axes.length >= MAX_AXES;
        return (
          <div key={type} className={cx(styles.objCard, selected && styles.sel)}>
            <div className={styles.objCardHeader} onClick={() => toggleCard(card, type)}>
              <div className={styles.objIcon}>{card.icon}</div>
              <div className={styles.objMainTitle}>{card.title}</div>
              <div className={styles.objCheck}>{selected ? "✓" : ""}</div>
            </div>
            {entry && (
              <div className={styles.objBody}>
                {card.isEvent ? (
                  <EventSection
                    entry={entry}
                    patch={(fields) => patch(type, fields)}
                    heading="Quel événement ?"
                    programme={programme}
                    onProgramme={onProgramme}
                    onPickOtherProgramme={onPickOtherProgramme}
                  />
                ) : perf ? (
                  <>
                    <div className={fx.axisHead}>
                      <span className={styles.subLabel}>{card.subLabel}</span>
                      <span className={fx.axisCount}>
                        {axes.length} sur {MAX_AXES}
                      </span>
                    </div>
                    <div className={fx.axisHelp}>Choisis jusqu&apos;à 3 axes, ou Tout.</div>
                    <div className={fx.axisGrid}>
                      {card.subcats.map((s) => {
                        const on = axes.includes(s);
                        const dim = !on && full && s !== AXIS_TOUT;
                        return (
                          <button
                            key={s}
                            type="button"
                            className={cx(fx.axis, on && fx.axisOn, dim && fx.axisDim)}
                            aria-pressed={on}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAxis(type, entry, s);
                            }}
                          >
                            <span>{s}</span>
                            {on && <span className={fx.axisCheck}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    {axisMsg && <div className={fx.axisMsg}>{axisMsg}</div>}
                  </>
                ) : (
                  <>
                    <span className={styles.subLabel}>{card.subLabel}</span>
                    <div className={styles.subcats}>
                      {card.subcats.map((s) => (
                        <div
                          key={s}
                          className={cx(styles.subcat, entry.sousCat === s && styles.sel)}
                          onClick={(e) => {
                            e.stopPropagation();
                            patch(type, { sousCat: s });
                          }}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {!card.isEvent && (
                  <div className={fx.metaStack}>
                    {!competition && (
                      <div className={fx.metaGroup}>
                        <label>{card.deadlineLabel}</label>
                        <div className={fx.pills}>
                          {card.deadlineOptions.map((d) => (
                            <button
                              key={d}
                              type="button"
                              className={entry.deadline === d ? fx.pillOn : fx.pill}
                              onClick={(e) => {
                                e.stopPropagation();
                                patch(type, { deadline: d });
                              }}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={fx.metaGroup}>
                      <label>{card.prioLabel}</label>
                      <div className={fx.pills}>
                        {card.prioOptions.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={entry.priorite === p ? fx.pillOn : fx.pill}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Quitter « Compétition » efface l'événement de la fiche.
                              patch(type, p === "Compétition" ? { priorite: p } : { priorite: p, event: "", dateExacte: "", categorie: "", fiche: {} });
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {competition && (
                  <EventSection
                    entry={entry}
                    patch={(fields) => patch(type, { ...fields, priorite: "Compétition" })}
                    heading="Quelle compétition ?"
                    programme={programme}
                    onProgramme={onProgramme}
                    onPickOtherProgramme={onPickOtherProgramme}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const EQUIPEMENTS = [
  "🏋️ Salle complète",
  "🏠 Maison (équipement limité)",
  "🌳 Extérieur / Calisthénie",
  "🔄 Les deux (salle + maison)",
];

export const RESTRICTIONS = [
  "Aucune restriction",
  "🥛 Intolérance lactose",
  "🌾 Gluten",
  "🐖 Pas de porc",
  "🍖 Végétarien",
  "🌱 Vegan",
  "🤢 Problèmes digestifs",
];

export const COMPLEMENTS = [
  "☀️ Vitamine D3/K2",
  "🐟 Oméga 3",
  "😴 Magnésium",
  "⚡ Zinc",
  "💪 Créatine",
  "🔥 L-Citrulline",
  "🌿 Ashwagandha",
  "💊 Maca",
  "🌿 Ginseng",
  "🥛 Protéines en poudre",
  "🧴 Collagène",
  "🫐 Vitamine C / Antioxydants",
  "🔬 Probiotiques",
  "⚗️ BCAA / Acides aminés",
  "🩸 Fer",
  "🌊 Spiruline / Chlorelle",
  "🦁 Tongkat Ali",
  "🔥 Horny Goat Weed",
  "Aucun pour l'instant",
];

export const SPORT_OPTGROUPS: { label: string; options: string[] }[] = [
  {
    label: "⚡ PROGRAMMATIONS EL COACH METHOD",
    options: Object.keys(SPORT_LABEL_TO_SLUG),
  },
  ...SPORT_GROUPS,
];

export function emptyEcmProfile(preselectedProgramme = ""): EcmProfileCookie {
  return {
    prenom: "",
    dateNaissance: "",
    taille: "",
    poids: "",
    objectifs: [],
    programmePrincipal: preselectedProgramme,
    weekCycle: emptyWeekCycle(),
    equip: "",
    jeune: null,
    tj: "",
    df: "",
    ff: "",
    rest: [],
    hydra: "",
    bles: null,
    bt: "",
    comp: [],
    ca: "",
    qs: "",
    ds: "",
  };
}

/** Header partagé "Bienvenue." / "Content de te revoir." / "Je mets à jour mon profil". */
export function EcmPageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "← Retour",
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className={styles.pageHeader}>
      {backHref && (
        <BackHomeButton href={backHref} label={backLabel} style={{ position: "absolute", top: 16, left: 16 }} />
      )}
      <div className={styles.pageHeaderLogo}>
        EL <span>COACH</span>
      </div>
      <h1 className={styles.pageHeaderTitle}>{title}</h1>
      {subtitle && <p className={styles.pageHeaderSubtitle}>{subtitle}</p>}
    </div>
  );
}

/** 15 caractères min. · 1 chiffre · 1 symbole — retourne le message d'erreur, ou null si valide. */
export function validatePassword(pw: string): string | null {
  const ok = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{15,}$/.test(pw);
  return ok ? null : "15 caractères minimum · 1 chiffre · 1 symbole requis";
}

export function MoSolo({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <>
      {options.map((o) => (
        <div key={o} className={cx(styles.mo, value === o && styles.sel)} onClick={() => onChange(o)}>
          <div className={styles.mc}>{value === o ? "✓" : ""}</div>
          {o}
        </div>
      ))}
    </>
  );
}

export function MoMulti({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <>
      {options.map((o) => (
        <div key={o} className={cx(styles.mo, values.includes(o) && styles.sel)} onClick={() => onToggle(o)}>
          <div className={styles.mc}>{values.includes(o) ? "✓" : ""}</div>
          {o}
        </div>
      ))}
    </>
  );
}

/** Multi-select plafonné à `max` — appelle onExceed() au lieu d'ajouter au-delà. */
export function MoMultiCapped({
  options,
  values,
  max,
  onToggle,
  onExceed,
}: {
  options: string[];
  values: string[];
  max: number;
  onToggle: (v: string) => void;
  onExceed: () => void;
}) {
  return (
    <>
      {options.map((o) => {
        const selected = values.includes(o);
        return (
          <div
            key={o}
            className={cx(styles.mo, selected && styles.sel)}
            onClick={() => {
              if (!selected && values.length >= max) {
                onExceed();
                return;
              }
              onToggle(o);
            }}
          >
            <div className={styles.mc}>{selected ? "✓" : ""}</div>
            {o}
          </div>
        );
      })}
    </>
  );
}

export function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className={styles.yn}>
      <div className={cx(styles.ynb, styles.y, value === true && styles.sel)} onClick={() => onChange(true)}>
        ✓ OUI
      </div>
      <div className={cx(styles.ynb, styles.n, value === false && styles.sel)} onClick={() => onChange(false)}>
        ✗ NON
      </div>
    </div>
  );
}

const WEEK_DAY_KEYS: WeekCycleDayKey[] = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const WEEK_DAY_LABELS: Record<WeekCycleDayKey, string> = {
  lun: "LUNDI",
  mar: "MARDI",
  mer: "MERCREDI",
  jeu: "JEUDI",
  ven: "VENDREDI",
  sam: "SAMEDI",
  dim: "DIMANCHE",
};

/** Programme ECM de référence — un champ dédié, séparé de la semaine type (pilote programSlug/profile.programme). */
export function ProgrammePrincipalPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.qc} id="programme-principal">
      <div className={styles.ql}>
        <i>⚡</i> Programme principal
      </div>
      <MoSolo options={Object.keys(SPORT_LABEL_TO_SLUG)} value={value} onChange={onChange} />
    </div>
  );
}

/** Semaine type — 7 jours, chacun avec repos ou plusieurs créneaux sport (matin/soir). */
export function WeekCyclePicker({
  value,
  programmeLabel,
  onChange,
  onReset,
  forceCustomized,
  hideHeader,
  onBeforeOpen,
  editorNote,
  onTouchDay,
  markedDays,
}: {
  value: WeekCycle;
  /** Partie 3 (mission 7) : le planificateur affiche lui-même badge, bouton et lien de réinitialisation. */
  hideHeader?: boolean;
  /** Appelé avant d'ouvrir l'éditeur d'un jour : renvoie false pour l'empêcher (aucune portée choisie). */
  onBeforeOpen?: (day: WeekCycleDayKey) => boolean;
  /** Ligne sous le titre de l'éditeur (« Sera appliqué : … »). */
  editorNote?: ReactNode;
  /** Jour effectivement modifié par l'utilisateur (pour enregistrer seulement ceux-là). */
  onTouchDay?: (day: WeekCycleDayKey) => void;
  /** Jours dont le contenu diffère de la semaine type : point d'accent sur le bouton. */
  markedDays?: WeekCycleDayKey[];
  /** Semaine modifiée individuellement : le lien "Rétablir" appelle ceci plutôt que de vider la semaine type. */
  onReset?: () => void;
  forceCustomized?: boolean;
  /** Programme principal choisi — dérive la semaine standard affichée tant
   * qu'aucun jour n'a été personnalisé (doc H.16). */
  programmeLabel: string;
  onChange: (next: WeekCycle) => void;
}) {
  const [activeDay, setActiveDay] = useState<WeekCycleDayKey | null>(null);
  const standardWeek = standardWeekFor(programmeLabel);
  // Personnalisée dès qu'un jour porte un repos explicite ou un sport choisi —
  // la semaine vide par défaut (emptyWeekCycle) ne déclenche jamais ça.
  const customized = forceCustomized || WEEK_DAY_KEYS.some((k) => value[k].repos || value[k].slots.length > 0);

  /** 1er edit (encore "standard") : fige d'abord tous les jours sur la
   * semaine standard, pour que la personnalisation ne parte pas d'une
   * semaine à moitié vide (doc H.16). */
  function seedIfNeeded(): WeekCycle {
    if (customized || !standardWeek) return value;
    const seeded = { ...value };
    WEEK_DAY_KEYS.forEach((k) => {
      seeded[k] = standardDayToWeekCycleDay(standardWeek[k]);
    });
    return seeded;
  }

  function patchDay(day: WeekCycleDayKey, patch: Partial<WeekCycle[WeekCycleDayKey]>) {
    onTouchDay?.(day);
    const base = seedIfNeeded();
    onChange({ ...base, [day]: { ...base[day], ...patch } });
  }
  function patchSlot(day: WeekCycleDayKey, idx: number, patch: Partial<WeekCycle[WeekCycleDayKey]["slots"][number]>) {
    const base = seedIfNeeded();
    patchDay(day, { slots: base[day].slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  }
  function addSlot(day: WeekCycleDayKey) {
    const base = seedIfNeeded();
    patchDay(day, { slots: [...base[day].slots, { sport: "", heure: "", duree: "", niveau: "" }] });
  }
  function removeSlot(day: WeekCycleDayKey, idx: number) {
    const base = seedIfNeeded();
    patchDay(day, { slots: base[day].slots.filter((_, i) => i !== idx) });
  }
  function resetToStandard() {
    if (onReset) {
      onReset();
      setActiveDay(null);
      return;
    }
    onChange(emptyWeekCycle());
    setActiveDay(null);
  }

  return (
    <div className={cx(styles.qc, styles.on)}>
      <div className={styles.ql}>
        <i>📅</i> Ma semaine type d&apos;entraînement
      </div>
      {!hideHeader && (
      <div className={styles.weekBadgeRow}>
        {customized ? (
          <span className={styles.weekBadge}>Semaine personnalisée</span>
        ) : (
          <span className={styles.weekBadge}>
            Semaine standard{standardWeek ? ` · Programme : ${programmeLabel.replace(/^\S+\s*/, "")}` : ""}
          </span>
        )}
        {customized && (
          <button type="button" className={styles.weekResetLink} onClick={resetToStandard}>
            Rétablir la semaine standard
          </button>
        )}
      </div>
      )}
      <p className={styles.weekHint}>
        Clique sur un jour. Tu peux ajouter plusieurs sports le même jour (matin + soir).
      </p>
      <div className={styles.weekSelector}>
        {WEEK_DAY_KEYS.map((d) => {
          const day = value[d];
          const standardDay = standardWeek?.[d] ?? null;
          const displayRest = customized ? day.repos : !standardDay;
          const displaySport = customized ? day.slots.find((s) => s.sport)?.sport ?? null : standardDay && `${standardDay.icon} ${standardDay.label}`;
          const hasSport = !displayRest && !!displaySport;
          return (
            <div
              key={d}
              className={cx(
                styles.dayBtn,
                activeDay === d && styles.active,
                hasSport && styles.hasSport,
                displayRest && styles.isRest,
              )}
              onClick={() => {
                if (onBeforeOpen && !onBeforeOpen(d)) return;
                setActiveDay(d);
              }}
            >
              {markedDays?.includes(d) && <span className={styles.dayDot} aria-label="Modifié" />}
              <div className={styles.dayBtnName}>{d.toUpperCase()}</div>
              <div className={styles.dayBtnActivity}>{displayRest ? "Repos" : displaySport ?? "—"}</div>
            </div>
          );
        })}
      </div>
      {activeDay && (
        <div className={cx(styles.dayDetail, styles.visible)}>
          <div className={styles.dayDetailTitle}>{WEEK_DAY_LABELS[activeDay]} : que prévois-tu ?</div>
          {editorNote && <div className={styles.weekHint}>{editorNote}</div>}
          <label className={styles.dayRestRow}>
            <input
              type="checkbox"
              checked={value[activeDay].repos}
              onChange={(e) => patchDay(activeDay, { repos: e.target.checked })}
            />
            🛋️ Jour de repos
          </label>
          {!value[activeDay].repos && (
            <>
              {value[activeDay].slots.map((slot, idx) => (
                <div key={idx} className={styles.sportSlot}>
                  <div className={styles.sportSlotHeader}>
                    <span className={styles.sportSlotLabel}>
                      {idx === 0 ? "🌅 Matin / Unique" : `🌆 Soir / ${idx + 1}ème séance`}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        className={styles.btnRemoveSlot}
                        onClick={() => removeSlot(activeDay, idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    className={styles.slotSelect}
                    value={slot.sport}
                    onChange={(e) => patchSlot(activeDay, idx, { sport: e.target.value })}
                  >
                    <option value="" disabled>
                      Choisir un sport...
                    </option>
                    {SPORT_OPTGROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className={styles.slotRow}>
                    <input
                      className={styles.slotInput}
                      type="text"
                      placeholder="ex: 18h30"
                      value={slot.heure}
                      onChange={(e) => patchSlot(activeDay, idx, { heure: e.target.value })}
                    />
                    <input
                      className={styles.slotInput}
                      type="text"
                      placeholder="ex: 1h30"
                      value={slot.duree}
                      onChange={(e) => patchSlot(activeDay, idx, { duree: e.target.value })}
                    />
                  </div>
                  <div className={styles.slotNiveau}>
                    {LEVELS.map((l) => (
                      <div
                        key={l}
                        className={cx(styles.slotNivBtn, slot.niveau === l && styles.sel)}
                        onClick={() => patchSlot(activeDay, idx, { niveau: l })}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className={styles.btnAddSport} onClick={() => addSlot(activeDay)}>
                + Ajouter un sport
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
