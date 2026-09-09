"use client";

// ============================================================================
// Composants et constantes partagés entre le flow d'inscription (onglet
// "Bienvenue" — ecm-signup-form.tsx) et le flow d'édition de profil (onglet
// "J'ai changé" — ecm-update-form.tsx). Purs, sans état externe.
// ============================================================================

import type { EcmProfileCookie, EcmSport } from "./actions";
import styles from "./ecm-signup.module.css";

export const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export const LEFT_PROGRAMS: { name: string; tag: string }[] = [
  { name: "CrossFit Pure", tag: "Force · Olympique · Metcon" },
  { name: "Hybrid Engine", tag: "CrossFit · Muscu · Adaptatif" },
  { name: "Hyrox Pure", tag: "Stations · Course · Compétition" },
  { name: "Volume Block Hypertrophy", tag: "Split · Volume · Progression" },
  { name: "At Home", tag: "Bodyweight · Accessible · Run" },
];

export const SPORT_LABEL_TO_SLUG: Record<string, string> = {
  "⚡ CrossFit Pure": "crossfit-pure",
  "🔥 Hybrid Engine": "hybrid-cf-strength",
  "🏁 Hyrox Pure": "hyrox-pure",
  "💪 Volume Block Hypertrophy": "volume-block-hypertrophy",
  "🏠 At Home": "at-home",
};

export const SLUG_TO_SPORT_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SPORT_LABEL_TO_SLUG).map(([label, slug]) => [slug, label]),
);

export const DAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
export const LEVELS = ["🌱 Débutant", "📈 Intermédiaire", "🔥 Avancé", "⚡ Élite"];

export const OBJECTIFS = [
  "🔥 Réduire la graisse corporelle",
  "💪 Gagner de la masse musculaire",
  "🏆 Améliorer mes performances sportives",
  "⚡ Recomposition corporelle",
  "🧘 Bien-être général",
];

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

export const EMPTY_SPORT: EcmSport = { nom: "", jours: [], h: "", du: "", niv: "" };

export function emptyEcmProfile(preselectedSport = ""): EcmProfileCookie {
  return {
    prenom: "",
    age: "",
    taille: "",
    poids: "",
    obj: [],
    s1: { ...EMPTY_SPORT, nom: preselectedSport },
    s2: { ...EMPTY_SPORT },
    s2on: false,
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
export function EcmPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderLogo}>
        EL <span>COACH</span>
      </div>
      <h1 className={styles.pageHeaderTitle}>{title}</h1>
      {subtitle && <p className={styles.pageHeaderSubtitle}>{subtitle}</p>}
    </div>
  );
}

/** 8 caractères min. · 1 chiffre · 1 symbole — retourne le message d'erreur, ou null si valide. */
export function validatePassword(pw: string): string | null {
  const ok = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
  return ok ? null : "8 caractères minimum · 1 chiffre · 1 symbole requis";
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

export function SportBlock({
  title,
  sport,
  onField,
  onDay,
  onRemove,
}: {
  title: string;
  sport: EcmSport;
  onField: (patch: Partial<EcmSport>) => void;
  onDay: (day: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div className={styles.sb}>
      <div className={styles.sbt}>
        {title}
        {onRemove && (
          <span className={styles.rm} onClick={onRemove}>
            ✕ Supprimer
          </span>
        )}
      </div>
      <select className={styles.ss} value={sport.nom} onChange={(e) => onField({ nom: e.target.value })}>
        <option value="" disabled>
          Choisir ta programmation / sport...
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
        <option value="Autre">Autre</option>
      </select>
      <div className={styles.dl}>📅 Jours d&apos;entraînement</div>
      <div className={styles.dg}>
        {DAYS.map((d) => (
          <div key={d} className={cx(styles.db, sport.jours.includes(d) && styles.sel)} onClick={() => onDay(d)}>
            {d}
          </div>
        ))}
      </div>
      <div className={styles.dr}>
        <div className={styles.di}>
          <label>⏰ Heure de séance</label>
          <input
            className={styles.mi}
            type="text"
            placeholder="ex: 18h30"
            value={sport.h}
            onChange={(e) => onField({ h: e.target.value })}
          />
        </div>
        <div className={styles.di}>
          <label>⏱️ Durée moyenne</label>
          <input
            className={styles.mi}
            type="text"
            placeholder="ex: 1h30"
            value={sport.du}
            onChange={(e) => onField({ du: e.target.value })}
          />
        </div>
      </div>
      <div className={styles.ll}>🏆 Niveau</div>
      <div className={styles.lb}>
        {LEVELS.map((l) => (
          <div key={l} className={cx(styles.lbb, sport.niv === l && styles.sel)} onClick={() => onField({ niv: l })}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
