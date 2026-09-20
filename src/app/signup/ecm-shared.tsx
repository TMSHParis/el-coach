"use client";

// ============================================================================
// Composants et constantes partagés entre le flow d'inscription (onglet
// "Bienvenue" — ecm-signup-form.tsx) et le flow d'édition de profil (onglet
// "J'ai changé" — ecm-update-form.tsx). Purs, sans état externe.
// ============================================================================

import { useState } from "react";
import type { EcmProfileCookie, EcmObjectifDetail, WeekCycle, WeekCycleDay, WeekCycleDayKey } from "./actions";
import { BackHomeButton } from "@/components/back-home-button";
import styles from "./ecm-signup.module.css";

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

function emptyObjectifDetail(card: ObjectifCardConfig): EcmObjectifDetail {
  return { type: `${card.icon} ${card.title}`, sousCat: "", deadline: "", priorite: "", event: "" };
}

/** Section complète "Mes objectifs" (2 max) — cartes accordéon avec sous-catégorie/deadline/priorité. */
export function ObjectifsPicker({
  values,
  onChange,
  onExceed,
}: {
  values: EcmObjectifDetail[];
  onChange: (next: EcmObjectifDetail[]) => void;
  onExceed: () => void;
}) {
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
        return (
          <div key={type} className={cx(styles.objCard, selected && styles.sel)}>
            <div className={styles.objCardHeader} onClick={() => toggleCard(card, type)}>
              <div className={styles.objIcon}>{card.icon}</div>
              <div className={styles.objMainTitle}>{card.title}</div>
              <div className={styles.objCheck}>{selected ? "✓" : ""}</div>
            </div>
            {entry && (
              <div className={styles.objBody}>
                <span className={styles.subLabel}>{card.subLabel}</span>
                {card.isEvent ? (
                  <>
                    <div className={styles.prepGrid}>
                      {card.subcats.map((s) => (
                        <div
                          key={s}
                          className={cx(styles.prepItem, entry.sousCat === s && styles.sel)}
                          onClick={(e) => {
                            e.stopPropagation();
                            patch(type, { sousCat: s, event: s === "Autre" ? "" : s });
                          }}
                        >
                          <span className={styles.prepIcon}>{card.subcatIcons?.[s] ?? "•"}</span>
                          {s}
                        </div>
                      ))}
                    </div>
                    {entry.sousCat === "Autre" && (
                      <div className={styles.prepAutre}>
                        <input
                          type="text"
                          placeholder="Décris ton événement..."
                          value={entry.event}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => patch(type, { event: e.target.value })}
                        />
                      </div>
                    )}
                  </>
                ) : (
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
                )}
                <div className={styles.objMeta}>
                  <div className={styles.objMetaGroup}>
                    <label>{card.deadlineLabel}</label>
                    <div className={styles.deadlineOpts}>
                      {card.deadlineOptions.map((d) => (
                        <div
                          key={d}
                          className={cx(styles.dlBtn, entry.deadline === d && styles.sel)}
                          onClick={(e) => {
                            e.stopPropagation();
                            patch(type, { deadline: d });
                          }}
                        >
                          <div className={styles.dlDot} />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.objMetaGroup}>
                    <label>{card.prioLabel}</label>
                    <div className={styles.prioOpts}>
                      {card.prioOptions.map((p) => (
                        <div
                          key={p}
                          className={cx(styles.prBtn, entry.priorite === p && styles.sel)}
                          onClick={(e) => {
                            e.stopPropagation();
                            patch(type, { priorite: p });
                          }}
                        >
                          <div className={styles.prDot} />
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
  {
    label: "🏃 COURS COLLECTIFS",
    options: ["Step", "CrossTraining", "CAF — Cuisse Abdo Fessier", "HIIT", "Cardio Boxe"],
  },
  {
    label: "🥊 SPORTS DE COMBAT",
    options: ["🥊 Boxe Thaï / Muay Thai", "🥋 MMA", "🥊 Boxe anglaise", "🥋 Jiu-Jitsu brésilien", "🥋 Judo / Lutte"],
  },
  {
    label: "🏃 CARDIO & ENDURANCE",
    options: ["🏃 Running", "🚴 Cyclisme", "🏊 Natation", "⛷️ Trail"],
  },
  {
    label: "⚽ SPORTS COLLECTIFS",
    options: ["⚽ Football", "🏀 Basketball", "🏈 Rugby", "🎾 Tennis / Padel"],
  },
  {
    label: "🧘 MOBILITÉ & BIEN-ÊTRE",
    options: ["🧘 Yoga / Pilates", "🤸 Calisthénie", "🧗 Escalade"],
  },
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
    <div className={styles.qc}>
      <div className={styles.ql}>
        <i>⚡</i> Programme principal
      </div>
      <MoSolo options={Object.keys(SPORT_LABEL_TO_SLUG)} value={value} onChange={onChange} />
    </div>
  );
}

/** Semaine type — 7 jours, chacun avec repos ou plusieurs créneaux sport (matin/soir). */
export function WeekCyclePicker({ value, onChange }: { value: WeekCycle; onChange: (next: WeekCycle) => void }) {
  const [activeDay, setActiveDay] = useState<WeekCycleDayKey | null>(null);

  function patchDay(day: WeekCycleDayKey, patch: Partial<WeekCycle[WeekCycleDayKey]>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  }
  function patchSlot(day: WeekCycleDayKey, idx: number, patch: Partial<WeekCycle[WeekCycleDayKey]["slots"][number]>) {
    patchDay(day, { slots: value[day].slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  }
  function addSlot(day: WeekCycleDayKey) {
    patchDay(day, { slots: [...value[day].slots, { sport: "", heure: "", duree: "", niveau: "" }] });
  }
  function removeSlot(day: WeekCycleDayKey, idx: number) {
    patchDay(day, { slots: value[day].slots.filter((_, i) => i !== idx) });
  }

  return (
    <div className={cx(styles.qc, styles.on)}>
      <div className={styles.ql}>
        <i>📅</i> Ma semaine type d&apos;entraînement
      </div>
      <p className={styles.weekHint}>
        Clique sur un jour. Tu peux ajouter plusieurs sports le même jour (matin + soir).
      </p>
      <div className={styles.weekSelector}>
        {WEEK_DAY_KEYS.map((d) => {
          const day = value[d];
          const hasSport = !day.repos && day.slots.some((s) => s.sport);
          return (
            <div
              key={d}
              className={cx(
                styles.dayBtn,
                activeDay === d && styles.active,
                hasSport && styles.hasSport,
                day.repos && styles.isRest,
              )}
              onClick={() => setActiveDay(d)}
            >
              <div className={styles.dayBtnName}>{d.toUpperCase()}</div>
              <div className={styles.dayBtnDot} />
            </div>
          );
        })}
      </div>
      {activeDay && (
        <div className={cx(styles.dayDetail, styles.visible)}>
          <div className={styles.dayDetailTitle}>{WEEK_DAY_LABELS[activeDay]}</div>
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
