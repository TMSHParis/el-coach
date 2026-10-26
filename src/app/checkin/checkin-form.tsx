"use client";

import { useEffect, useRef, useState } from "react";
import type { CheckinPlan } from "@/lib/checkin-plan";
import {
  COACH_PARAMS,
  FEATURE_FLAGS,
  EQUIPMENT_OPTIONS_AT_HOME,
  EQUIPMENT_OPTIONS_ECM,
  FOCUS_AT_HOME_OPTIONS,
  FOCUS_MUSCLE_OPTIONS,
  FORMAT_BY_MINUTES,
  type SessionFormat,
} from "@/lib/coach-params";
import { parseAvailableMinutes } from "@/lib/session-modular";
import { NO_IMPACT_COOKIE, ZONES, ZONE_COOKIE } from "@/lib/substitutions";
import { useRouter } from "next/navigation";
import { submitCheckin, type CheckinGender, type SleepPhotoAnalysis } from "./actions";
import { BackHomeButton } from "@/components/back-home-button";
import { SPORT_GROUPS, sportLabel } from "@/lib/sports-catalog";
import { formatDate, type DictKey, type Translate } from "@/lib/i18n";
import { useLang, useT } from "@/lib/i18n/provider";
import { REPOS_SUBTYPES, RECUP_SUBTYPES, isReposSubtype, isRecupSubtype } from "@/lib/seance-kinds";
import { SeancePicker, buildPickerGroups } from "./seance-picker";
import styles from "./checkin.module.css";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const energieLabel = (t: Translate, n: number) => t(`ci.energy.${n}` as DictKey);
const motivLabel = (t: Translate, n: number) => t(`ci.motiv.${n}` as DictKey);

/** Valeur d'option (français, enregistrée telle quelle) -> clé d'affichage. Les valeurs inconnues s'affichent telles quelles. */
const OPT_KEYS: Record<string, DictKey> = {
  "😩 Faible": "ci.opt.recupLow",
  "😐 Moyenne": "ci.opt.recupMid",
  "💪 Bonne": "ci.opt.recupGood",
  "🥗 Équilibré": "ci.opt.nutBalanced",
  "🍝 Correct": "ci.opt.nutOk",
  "🍔 Négligé": "ci.opt.nutPoor",
  "💧 Faible": "ci.opt.hydLow",
  "💧💧 Correcte": "ci.opt.hydOk",
  "💧💧💧 Élevée": "ci.opt.hydHigh",
  "🪶 Légères": "ci.opt.legsLight",
  "⚡ Légèrement lourdes": "ci.opt.legsMid",
  "🪨 Lourdes": "ci.opt.legsHeavy",
  "✅ Aucune": "ci.opt.painNone",
  "🟡 Légères": "ci.opt.painMild",
  "🔴 Intenses": "ci.opt.painSevere",
  "✨ Clair": "ci.opt.mentalClear",
  "🌤 Moyen": "ci.opt.mentalMid",
  "🌫 Brouillard": "ci.opt.mentalFog",
  "😌 Faible": "ci.opt.stressLow",
  "😐 Modéré": "ci.opt.stressMid",
  "😰 Élevé": "ci.opt.stressHigh",
  "🔥 Bonne": "ci.opt.libidoGood",
  "💛 Moyenne": "ci.opt.libidoMid",
  "🩶 Basse": "ci.opt.libidoLow",
  Légère: "ci.opt.intLight",
  Modérée: "ci.opt.intModerate",
  Intense: "ci.opt.intHard",
  Maximum: "ci.opt.intMax",
  "Complet (5 blocs)": "ci.opt.fmtFull",
  "Deux blocs (2 × 4 mouvements)": "ci.opt.fmtTwo",
  "Un seul bloc (6 à 8 mouvements)": "ci.opt.fmtOne",
  "Upper Body": "ci.volume.upper",
  "Lower Body": "ci.volume.lower",
  "Full Body": "ci.volume.full",
  Bras: "ci.opt.arms",
  Épaules: "ci.opt.shoulders",
  Abdos: "ci.opt.abs",
  Dos: "ci.opt.back",
  Pectoraux: "ci.opt.chest",
  Fessiers: "ci.opt.glutes",
  Mollets: "ci.opt.calves",
  "Haut du corps": "ci.opt.upperBody",
  Jambes: "ci.opt.legs",
  Core: "ci.opt.core",
  Skill: "ci.opt.skill",
  "Salle complète": "ci.opt.gymFull",
  "Haltères seulement": "ci.opt.dumbbells",
  "Poids du corps": "ci.opt.bodyweight",
  Étendu: "ci.opt.homeExtended",
  Basique: "ci.opt.homeBasic",
  Aucun: "ci.opt.homeNone",
  Épaule: "ci.opt.zoneShoulder",
  Genou: "ci.opt.zoneKnee",
  Poignet: "ci.opt.zoneWrist",
  Autre: "ci.opt.zoneOther",
};

/** Texte affiché d'une option (la valeur, elle, reste inchangée). */
function optText(t: Translate, lang: Parameters<typeof sportLabel>[1], o: string): string {
  const k = OPT_KEYS[o];
  return k ? t(k) : sportLabel(o, lang);
}

const ECM_PROGRAM_OPTIONS = ["⚡ CrossFit Pure", "🔥 Hybrid Engine", "🏁 Hyrox Pure", "💪 Volume Block Hypertrophy", "🏠 At Home"];

/** Entrée du <select> "Séance du jour" — `value` est ce qui est stocké/envoyé,
 * `label` ce qui s'affiche dans l'option. Pour le groupe REPOS, `value` est une
 * sentinelle (`__repos__`/`__recup__`) qui ouvre l'accordéon de sous-types au
 * lieu de fixer directement la séance — voir `onSelectChange`. */
export type SeanceOption = { value: string; label: string };

const REPOS_SENTINEL_OPTIONS: SeanceOption[] = [
  { value: "__repos__", label: "😴 Repos" },
  { value: "__recup__", label: "🚶 Récupération active" },
];

export const SEANCE_GROUPS: { label: string; options: SeanceOption[] }[] = [
  { label: "🛋️ REPOS", options: REPOS_SENTINEL_OPTIONS },
  { label: "⚡ PROGRAMMATIONS ECM", options: ECM_PROGRAM_OPTIONS.map((o) => ({ value: o, label: o })) },
  ...SPORT_GROUPS.map((g) => ({ label: g.label, options: g.options.map((o) => ({ value: o, label: o })) })),
];

/** Groupes du <select> "Séance du jour", avec les programmes actifs en tête. */
export function buildSeanceGroups(programmes: string[]): { label: string; options: SeanceOption[] }[] {
  const actifs = programmes.filter((p) => ECM_PROGRAM_OPTIONS.includes(p));
  if (actifs.length === 0) return SEANCE_GROUPS;
  return SEANCE_GROUPS.map((g) =>
    g.label === "⚡ PROGRAMMATIONS ECM"
      ? { label: "⚡ MES PROGRAMMES", options: actifs.map((o) => ({ value: o, label: o })) }
      : g,
  );
}

const VOLUME_BLOCK_LABEL = "💪 Volume Block Hypertrophy";
const VOLUME_FOCUS_OPTIONS: { value: string; label: string }[] = [
  { value: "upper", label: "Upper Body" },
  { value: "lower", label: "Lower Body" },
  { value: "full", label: "Full Body" },
];

function isVolumeBlock(seance: string): boolean {
  return seance === VOLUME_BLOCK_LABEL;
}

/** Rotation suggérée sur la semaine : lundi haut, mardi bas, jeudi complet, etc. */
function suggestedVolumeFocus(): string {
  const day = new Date().getDay(); // 0 = dimanche
  if (day === 1 || day === 5) return "upper";
  if (day === 2 || day === 6) return "lower";
  return "full";
}
const FORMAT_OPTIONS: { value: SessionFormat; label: string; hint: string; nameKey: DictKey }[] = [
  { value: "complet", label: "Complet", hint: "5 blocs", nameKey: "ci.opt.fmtFullName" },
  { value: "deux_blocs", label: "Deux blocs", hint: "2 × 4 mouvements", nameKey: "ci.opt.fmtTwoName" },
  { value: "un_bloc", label: "Un seul bloc", hint: "6 à 8 mouvements", nameKey: "ci.opt.fmtOneName" },
];
const INTENSITE_OPTIONS = ["Légère", "Modérée", "Intense", "Maximum"];

const RECUP_PERCUE_OPTIONS = ["😩 Faible", "😐 Moyenne", "💪 Bonne"];
const NUTRITION_OPTIONS = ["🥗 Équilibré", "🍝 Correct", "🍔 Négligé"];
const HYDRATATION_OPTIONS = ["💧 Faible", "💧💧 Correcte", "💧💧💧 Élevée"];

type FormState = {
  gender: CheckinGender;
  sleepPhotoPreview: string | null;
  sleepPhoto: boolean;
  sleepCoucher: string;
  sleepReveil: string;
  sleepDuree: string;
  sleepAnalysis: SleepPhotoAnalysis | null;
  sleepAnalyzing: boolean;
  recuperationPercue: string;
  poids: string;
  jambes: string;
  douleur: boolean | null;
  douleurTxt: string;
  cycle: boolean | null;
  cycleDouleur: string;
  cycleJour: string;
  energie: number | null;
  motivation: number | null;
  mental: string;
  stress: string;
  libido: string;
  nutrition: string;
  hydratation: string;
  seance: string;
  /** Sentinelle du <select> ouvrant l'accordéon Repos/Récup — null = sélection directe (sport/ECM). */
  seanceAccordion: "repos" | "recup" | null;
  /** Liste de sous-types de l'accordéon dépliée (se referme dès qu'un choix est fait). */
  accordionOpen: boolean;
  travail: boolean | null;
  soirPerformance: boolean | null;
  notes: string;
  seanceFocus: string[];
  seanceDuree: string;
  seanceEquipement: string;
  seanceIntensite: string;
  seanceNote: string;
  /** "complet" | "deux_blocs" | "un_bloc" (vide = séance du programme). */
  seanceFormat: string;
  volumeBlockFocus: string;
};

const INITIAL_STATE: FormState = {
  gender: "h",
  sleepPhotoPreview: null,
  sleepPhoto: false,
  sleepCoucher: "",
  sleepReveil: "",
  sleepDuree: "",
  sleepAnalysis: null,
  sleepAnalyzing: false,
  recuperationPercue: "",
  poids: "",
  jambes: "",
  douleur: null,
  douleurTxt: "",
  cycle: null,
  cycleDouleur: "",
  cycleJour: "",
  energie: null,
  motivation: null,
  mental: "",
  stress: "",
  libido: "",
  nutrition: "",
  hydratation: "",
  seance: "",
  seanceAccordion: null,
  accordionOpen: false,
  travail: null,
  soirPerformance: null,
  notes: "",
  seanceFocus: [],
  seanceDuree: "",
  seanceEquipement: "",
  seanceIntensite: "",
  seanceNote: "",
  seanceFormat: "",
  volumeBlockFocus: "",
};

/** Sentinelle de l'accordéon dans laquelle `value` (une fois choisie) retombe — null si ni repos ni récup. */
function accordionKindOf(value: string): "repos" | "recup" | null {
  if (isReposSubtype(value)) return "repos";
  if (isRecupSubtype(value)) return "recup";
  return null;
}

export function CheckinForm({
  habits = [],
  plan = { kind: "none" },
  programs = [],
  prevCheckin = null,
}: {
  /** 3 séances les plus fréquentes des 30 derniers jours (la plus fréquente en premier). */
  habits?: string[];
  /** Ce que la semaine enregistrée prévoit aujourd'hui (mission 9). */
  plan?: CheckinPlan;
  /** Les 5 programmes ECM avec leur séance suivante, le programme prévu en tête (mission 10). */
  programs?: { value: string; icon: string; name: string; next: string; planned: boolean }[];
  /** Rappel du dernier check-in réalisé (bandeau sous le header). */
  prevCheckin?: { dayLabel: string; stateLabel: string; seance: string | null; energie: number | null } | null;
}) {
  const router = useRouter();
  const t = useT();
  const { lang } = useLang();
  const dateStr = formatDate(lang, new Date(), { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Mission 9 : la ligne « Séance du jour » est préremplie avec la séance prévue (modifiable).
  const plannedSeance =
    plan.kind === "day" ? (plan.cards.find((c) => c.ecm)?.value ?? plan.cards[0]?.value ?? "") : "";
  const [d, setD] = useState<FormState>(() => ({ ...INITIAL_STATE, seance: plannedSeance }));
  const [trainAnyway, setTrainAnyway] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pickerGroups = buildPickerGroups(programs, t, lang);
  // Jour de repos prévu (sans « Je m'entraîne quand même ») ou jour 100 % hors ECM : la ligne n'est pas affichée.
  const restMode = plan.kind === "rest" && !trainAnyway;
  const hideSeanceRow = restMode;
  const effectiveSeance = restMode ? REPOS_SUBTYPES[0] : d.seance;
  const plannedProgram = plan.kind === "day" ? plan.cards.find((c) => c.ecm)?.value : undefined;
  const [submitting, setSubmitting] = useState(false);
  const [slowSubmit, setSlowSubmit] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [demandeOpen, setDemandeOpen] = useState(false);

  // La semaine est relue à minuit : une modification de la semaine est visible au prochain affichage.
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const id = setTimeout(() => router.refresh(), midnight.getTime() - now.getTime());
    return () => clearTimeout(id);
  }, [router]);

  useEffect(() => {
    if (!submitting) {
      setSlowSubmit(false);
      return;
    }
    const id = setTimeout(() => setSlowSubmit(true), 10_000);
    return () => clearTimeout(id);
  }, [submitting]);
  const set = (patch: Partial<FormState>) => setD((prev) => ({ ...prev, ...patch }));
  const g = d.gender;
  const isH = g === "h";

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = String(e.target?.result ?? "");
      set({ sleepPhoto: true, sleepPhotoPreview: dataUrl, sleepAnalyzing: true });

      const [, base64] = dataUrl.split(",");
      try {
        const res = await fetch("/api/analyze-sleep-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        });
        if (!res.ok) throw new Error(await res.text());
        const analysis = (await res.json()) as SleepPhotoAnalysis;
        set({
          sleepAnalysis: analysis,
          sleepAnalyzing: false,
          sleepCoucher: analysis.coucher ?? d.sleepCoucher,
          sleepReveil: analysis.reveil ?? d.sleepReveil,
          sleepDuree: analysis.total ?? d.sleepDuree,
        });
      } catch {
        // Analyse indisponible (clé absente, erreur réseau...) — la saisie manuelle reste possible.
        set({ sleepAnalyzing: false });
      }
    };
    reader.readAsDataURL(file);
  }

  // Séance du jour — sélection directe (sport/ECM/habitude) : ferme l'accordéon
  // et ouvre "Personnaliser ma séance" au prochain rendu (gérée par showPersonalize).
  function chooseSeance(value: string) {
    set({ seance: value, seanceAccordion: accordionKindOf(value), accordionOpen: false });
  }

  // <select> natif : une entrée sport/ECM sélectionne directement ; une
  // sentinelle __repos__/__recup__ ouvre l'accordéon correspondant sans encore
  // fixer de séance précise (l'utilisateur doit choisir un sous-type).
  function onSelectChange(value: string) {
    if (value === "__repos__" || value === "__recup__") {
      set({ seance: "", seanceAccordion: value === "__repos__" ? "repos" : "recup", accordionOpen: true });
      return;
    }
    chooseSeance(value);
  }

  function chooseSubtype(value: string) {
    set({ seance: value, accordionOpen: false });
  }

  // "Personnaliser ma séance" : uniquement pour un vrai sport/programme — jamais
  // pour repos ou récupération active, quel que soit le sous-type choisi.
  const showPersonalize = Boolean(d.seance) && d.seanceAccordion === null;
  const showChosen = d.seanceAccordion !== null && Boolean(d.seance);

  // Suggestions contextuelles (badge "Suggéré") sur les sous-options de repos/récup —
  // état jaune/rouge déclaré (sliders + cycle côté femme), indicatif uniquement.
  const cycleIntense = !isH && d.cycle === true && d.cycleDouleur === "🔴 Intenses";
  const cycleLegere = !isH && d.cycle === true && d.cycleDouleur === "🟡 Légères";
  const suggestedValues = new Set<string>(
    cycleIntense
      ? ["😴 Repos total", "💤 Repos + sommeil prioritaire"]
      : cycleLegere
        ? ["🚶 Marche", "🧘 Yoga / mobilité"]
        : d.energie !== null && d.energie <= 5
          ? ["🚶 Marche"]
          : [],
  );

  function validate(): string[] {
    const miss: string[] = [];
    const sleepOk = d.sleepPhoto || d.sleepDuree || d.sleepCoucher;
    if (!sleepOk) miss.push(t("ci.miss.sleep"));
    if (!d.recuperationPercue) miss.push(t("ci.miss.recovery"));
    if (!d.jambes) miss.push(t("ci.miss.legs"));
    if (d.douleur === null) miss.push(t("ci.miss.pain"));
    if (!isH && d.cycle === null) miss.push(t("ci.miss.cycle"));
    if (!d.energie) miss.push(t("ci.miss.energy"));
    if (!d.motivation) miss.push(t("ci.miss.motivation"));
    if (!d.mental) miss.push(t("ci.miss.mental"));
    if (!d.stress) miss.push(t("ci.miss.stress"));
    if (!d.libido) miss.push(t("ci.miss.libido"));
    if (!effectiveSeance) miss.push(t("ci.miss.session"));
    if (d.travail === null) miss.push(t("ci.miss.work"));
    if (isH && d.soirPerformance === null) miss.push(t("ci.miss.evening"));
    return miss;
  }

  // Total des champs requis (mêmes que validate(), pour la barre de progression).
  const filledFields = [
    d.sleepPhoto || Boolean(d.sleepDuree) || Boolean(d.sleepCoucher),
    Boolean(d.recuperationPercue),
    Boolean(d.jambes),
    d.douleur !== null,
    !isH ? d.cycle !== null : true,
    Boolean(d.energie),
    Boolean(d.motivation),
    Boolean(d.mental),
    Boolean(d.stress),
    Boolean(d.libido),
    Boolean(effectiveSeance),
    d.travail !== null,
    isH ? d.soirPerformance !== null : true,
  ].filter(Boolean).length;
  const progressTotal = 13;
  const progressPct = Math.round((filledFields / progressTotal) * 100);

  // État live (⚪/🟢/🟡/🔴) — mêmes seuils que la suggestion contextuelle.
  const liveState = (() => {
    if (d.energie === null && d.mental === "") return { cls: "", emoji: "⚪", title: t("ci.live.waitTitle"), sub: t("ci.live.waitSub") };
    if ((d.energie !== null && d.energie <= 5) || d.mental === "🌫 Brouillard" || d.jambes === "🪨 Lourdes" || d.stress === "😰 Élevé" || cycleIntense) {
      return { cls: "red", emoji: "🔴", title: t("ci.live.redTitle"), sub: cycleIntense ? t("ci.live.redSubPain") : t("ci.live.redSubFatigue") };
    }
    if ((d.energie !== null && d.energie <= 7) || d.stress === "😐 Modéré") {
      return { cls: "yellow", emoji: "🟡", title: t("ci.live.yellowTitle"), sub: t("ci.live.yellowSub") };
    }
    return { cls: "green", emoji: "🟢", title: t("ci.live.greenTitle"), sub: t("ci.live.greenSub") };
  })();

  async function handleSubmit() {
    const miss = validate();
    setMissing(miss);
    setFormError(null);
    if (miss.length) return;

    setSubmitting(true);
    let result: { ok: true; fatigueScore: number } | { ok: false; error: string };
    try {
      result = await submitCheckin({
        genre: g,
        sleepPhoto: d.sleepPhoto,
        sleepCoucher: d.sleepCoucher,
        sleepReveil: d.sleepReveil,
        sleepDuree: d.sleepDuree,
        sleepAnalysis: d.sleepAnalysis,
        recuperationPercue: d.recuperationPercue,
        poids: d.poids,
        jambes: d.jambes,
        douleur: d.douleur,
        douleurDetail: d.douleurTxt,
        cycle: isH ? null : d.cycle,
        cycleDouleur: isH ? "" : d.cycleDouleur,
        cycleJour: isH ? "" : d.cycleJour,
        energie: d.energie,
        motivation: d.motivation,
        mental: d.mental,
        stress: d.stress,
        libido: d.libido,
        nutrition: d.nutrition,
        hydratation: d.hydratation,
        seance: d.seance,
        travail: d.travail,
        soirPerformance: isH ? d.soirPerformance : null,
        notes: d.notes,
        seanceFocus: d.seanceFocus,
        seanceDuree: d.seanceDuree,
        seanceEquipement: d.seanceEquipement,
        seanceIntensite: d.seanceIntensite,
        seanceNote: d.seanceNote,
        seanceFormat: d.seanceFormat,
        volumeBlockFocus: isVolumeBlock(d.seance) ? d.volumeBlockFocus || suggestedVolumeFocus() : "",
      });
    } catch {
      // Appel réseau qui n'a jamais atteint le serveur (offline, timeout...) —
      // on ne laisse jamais ça planter le composant et effacer le formulaire
      // déjà rempli : on reste sur place, rien n'est perdu, l'utilisateur peut
      // simplement réessayer. Message adapté selon que le client est hors
      // ligne ou non (pas "connexion perdue" à tort s'il est bien connecté).
      setSubmitting(false);
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setFormError(offline ? t("ci.err.offline") : t("ci.err.noReply"));
      return;
    }
    if (!result.ok) {
      setSubmitting(false);
      setFormError(result.error);
      return;
    }
    // Page mindset intermédiaire (elle enchaîne sur le dashboard) — replace pour
    // que le retour depuis le dashboard ramène avant le check-in, pas au formulaire.
    router.replace("/mindset");
  }

  return (
    <div className={styles.checkinRoot}>
      {submitting && (
        <div data-hide-scroll-top className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>
            {slowSubmit ? t("ci.loading.slow") : t("ci.loading.plan")}
          </div>
        </div>
      )}

      <div className={styles.hero}>
        <BackHomeButton style={{ position: "absolute", top: 16, left: 16, zIndex: 2 }} />
        <div className={styles.logo}>⚡</div>
        <div className={styles.bn}>EL COACH METHOD</div>
        <div className={styles.bt}>Daily Performance Check-In</div>
        <div className={styles.hdiv} />
        <div className={styles.dateRow}>
          <div className={styles.datePill}>{dateStr}</div>
          <div className={cx(styles.sportBadge, isH ? styles.h : styles.f)}>
            {isH ? t("ci.hero.male") : t("ci.hero.female")}
          </div>
        </div>
      </div>

      {prevCheckin && (
        <div className={styles.prevCheckin}>
          {t("ci.prev.head", { day: prevCheckin.dayLabel, state: prevCheckin.stateLabel })}
          {prevCheckin.seance ? ` · ${prevCheckin.seance}` : ""}
          {prevCheckin.energie ? ` · ${t("ci.prev.energy", { n: prevCheckin.energie })}` : ""}
        </div>
      )}

      {(formError || missing.length > 0) && (
        <div className={styles.errorBanner}>
          {formError ?? t("ci.err.complete", { fields: missing.join(", ") })}
        </div>
      )}

      <div className={styles.genderTabs}>
        <div
          className={cx(styles.gtab, isH && styles.activeH)}
          onClick={() => set({ gender: "h" })}
        >
          {t("ci.tab.male")}
          <div className={styles.gtabSub}>{t("ci.tab.maleSub")}</div>
        </div>
        <div
          className={cx(styles.gtab, !isH && styles.activeF)}
          onClick={() => set({ gender: "f" })}
        >
          {t("ci.tab.female")}
          <div className={styles.gtabSub}>{t("ci.tab.femaleSub")}</div>
        </div>
      </div>

      <div className={styles.fw}>
        <SectionKicker number="01" title={t("ci.sec.01")} />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>{t("ci.sl.sleep")}</div>
        <div className={cx(styles.qc, (d.sleepPhoto || d.sleepDuree) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>📱</i> {t("ci.q.sleepTracking")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <label className={cx(styles.photoZone, isH ? styles.ph : styles.pf)}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
            {d.sleepPhotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.prev} src={d.sleepPhotoPreview} alt="" />
            ) : (
              <>
                <div className={styles.pi}>📸</div>
                <div className={styles.pt}>
                  <strong className={isH ? styles.h : styles.f}>{t("ci.photo.title")}</strong>
                  Apple Watch, Garmin, Polar, Whoop...
                </div>
              </>
            )}
          </label>
          {d.sleepAnalyzing && (
            <div className={cx(styles.pok, isH ? styles.h : styles.f)}>{t("ci.photo.analyzing")}</div>
          )}
          {d.sleepPhoto && !d.sleepAnalyzing && (
            <div className={cx(styles.pok, isH ? styles.h : styles.f)}>
              {d.sleepAnalysis ? t("ci.photo.analyzed") : t("ci.photo.added")}
            </div>
          )}
          <div className={styles.orSep}>{t("ci.sleep.or")}</div>
          <div className={styles.smw}>
            <div className={styles.smt}>{t("ci.sleep.manual")}</div>
            <div className={styles.smg}>
              <div className={styles.smi}>
                <label>{t("ci.sleep.bed")}</label>
                <input type="text" placeholder="23h00" value={d.sleepCoucher} onChange={(e) => set({ sleepCoucher: e.target.value })} />
              </div>
              <div className={styles.smi}>
                <label>{t("ci.sleep.wake")}</label>
                <input type="text" placeholder="07h00" value={d.sleepReveil} onChange={(e) => set({ sleepReveil: e.target.value })} />
              </div>
              <div className={styles.smi}>
                <label>{t("ci.sleep.duration")}</label>
                <input type="text" placeholder="7h30" value={d.sleepDuree} onChange={(e) => set({ sleepDuree: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className={cx(styles.qc, d.recuperationPercue && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🔄</i> {t("ci.q.recovery")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <OptRow gender={g} options={RECUP_PERCUE_OPTIONS} value={d.recuperationPercue} onChange={(v) => set({ recuperationPercue: v })} />
        </div>

        <SectionKicker number="02" title={t("ci.sec.02")} />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>{t("ci.sl.body")}</div>
        <div className={cx(styles.qc, styles.opt, d.poids && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>⚖️</i> {t("ci.q.weight")} <span className={styles.bo}>{t("ci.badge.optional")}</span>
          </div>
          <div className={styles.nr}>
            <input
              type="number"
              className={styles.ni}
              placeholder="—"
              min={30}
              max={200}
              step={0.1}
              value={d.poids}
              onChange={(e) => set({ poids: e.target.value })}
            />
            <span className={styles.nu}>kg</span>
          </div>
        </div>

        <div className={cx(styles.qc, d.jambes && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🦵</i> {t("ci.q.legs")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <OptRow gender={g} options={["🪶 Légères", "⚡ Légèrement lourdes", "🪨 Lourdes"]} value={d.jambes} onChange={(v) => set({ jambes: v })} />
        </div>

        <div className={cx(styles.qc, d.douleur !== null && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🤕</i> {t("ci.q.pain")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <YesNo gender={g} value={d.douleur} onChange={(v) => set({ douleur: v })} />
          {d.douleur && (
            <div style={{ marginTop: 9 }}>
              <input type="text" placeholder={t("ci.pain.placeholder")} value={d.douleurTxt} onChange={(e) => set({ douleurTxt: e.target.value })} />
            </div>
          )}
        </div>

        {!isH && (
          <div className={cx(styles.qc, d.cycle !== null && styles.onF)} style={{ borderColor: "rgba(236,72,153,.2)" }}>
            <div className={styles.ql}>
              <i>🌸</i> {t("ci.q.cycle")} <span className={styles.bf}>{t("ci.badge.required")}</span>
            </div>
            <YesNo gender={g} value={d.cycle} onChange={(v) => set({ cycle: v })} />
            {d.cycle && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: "var(--m)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>
                  {t("ci.q.cyclePain")}
                </div>
                <div className={styles.opts} style={{ marginBottom: 10 }}>
                  <OptRow
                    gender={g}
                    options={["✅ Aucune", "🟡 Légères", "🔴 Intenses"]}
                    value={d.cycleDouleur}
                    onChange={(v) => set({ cycleDouleur: v })}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--m)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>
                  {t("ci.q.cycleDay")}
                </div>
                <div className={styles.nr}>
                  <input
                    type="number"
                    className={styles.ni}
                    placeholder="—"
                    min={1}
                    max={35}
                    style={{ maxWidth: 80 }}
                    value={d.cycleJour}
                    onChange={(e) => set({ cycleJour: e.target.value })}
                  />
                  <span className={styles.nu}>{t("ci.cycle.days")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <SectionKicker number="03" title={t("ci.sec.03")} />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>{t("ci.sl.vitality")}</div>
        <div className={cx(styles.qc, Boolean(d.energie) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🔋</i> {t("ci.q.energy")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <div className={styles.sr}>
            <div className={cx(styles.sv, isH ? styles.h : styles.f)}>{d.energie ?? "—"}</div>
            <div className={styles.slr}>
              <span>{d.energie ? energieLabel(t, d.energie) : t("ci.slider.hint")}</span>/10
            </div>
          </div>
          <Track height={36} value={d.energie} onPick={(v) => set({ energie: v })} fillClass={isH ? styles.fh : styles.ff} />
        </div>

        <div className={cx(styles.qc, Boolean(d.motivation) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💥</i> {t("ci.q.motivation")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <div className={styles.sr}>
            <div className={cx(styles.sv, styles.motiv)}>{d.motivation ?? "—"}</div>
            <div className={styles.slr}>
              <span>{d.motivation ? motivLabel(t, d.motivation) : t("ci.slider.hint")}</span>/10
            </div>
          </div>
          <Track height={26} value={d.motivation} onPick={(v) => set({ motivation: v })} fillClass={styles.fm} />
        </div>

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>{t("ci.sl.mind")}</div>
        <div className={cx(styles.qc, d.mental && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🧠</i> {t("ci.q.mental")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <OptRow gender={g} options={["✨ Clair", "🌤 Moyen", "🌫 Brouillard"]} value={d.mental} onChange={(v) => set({ mental: v })} />
        </div>

        <div className={cx(styles.qc, d.stress && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>😤</i> {t("ci.q.stress")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <OptRow gender={g} options={["😌 Faible", "😐 Modéré", "😰 Élevé"]} value={d.stress} onChange={(v) => set({ stress: v })} />
        </div>

        <div className={cx(styles.qc, d.libido && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>❤️</i> {t("ci.q.libido")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <OptRow gender={g} options={["🔥 Bonne", "💛 Moyenne", "🩶 Basse"]} value={d.libido} onChange={(v) => set({ libido: v })} />
        </div>

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>{t("ci.sl.nutrition")}</div>
        <div className={cx(styles.qc, styles.opt, d.nutrition && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🥗</i> {t("ci.q.dinner")} <span className={styles.bo}>{t("ci.badge.optional")}</span>
          </div>
          <OptRow gender={g} options={NUTRITION_OPTIONS} value={d.nutrition} onChange={(v) => set({ nutrition: v })} />
        </div>
        <div className={cx(styles.qc, styles.opt, d.hydratation && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💧</i> {t("ci.q.hydration")} <span className={styles.bo}>{t("ci.badge.optional")}</span>
          </div>
          <OptRow gender={g} options={HYDRATATION_OPTIONS} value={d.hydratation} onChange={(v) => set({ hydratation: v })} />
        </div>

        <SectionKicker number="04" title={t("ci.sec.04")} />
        <div className={cx(styles.sl, styles.gold)}>{t("ci.sl.activity")}</div>
        <div className={cx(styles.qc, d.seance && (isH ? styles.onH : styles.onF))}>
          {habits.length > 0 && (
            <>
              <div className={styles.freqLabel}>{t("ci.habits")}</div>
              <div className={styles.freqRow}>
                {habits.map((h) => (
                  <div
                    key={h}
                    className={cx(styles.freqItem, plannedProgram && h === plannedProgram && styles.freqItemPlanned)}
                    onClick={() => chooseSeance(h)}
                  >
                    <p>{sportLabel(h, lang)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {plan.kind === "day" &&
            plan.cards.map((c, i) => (
              <div
                key={`${c.value}-${i}`}
                className={cx(styles.ecmToday, !c.ecm && styles.ecmTodayStatic)}
                onClick={c.ecm ? () => chooseSeance(c.value) : undefined}
              >
                <div className={styles.badgeToday}>{t("ci.plan.plannedToday")}</div>
                <div className={styles.etRow}>
                  <div className={styles.etIcon}>{c.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p className={styles.etTitle}>{c.name}</p>
                    <p className={styles.etSub}>{c.ecm ? c.sub : [c.heure, c.duree].filter(Boolean).join(" · ") || c.sub}</p>
                    {!c.ecm && (c.heure || c.duree) && <p className={styles.etSub}>{c.sub}</p>}
                  </div>
                  {c.ecm && c.heure && <span className={styles.etHeure}>{c.heure}</span>}
                </div>
              </div>
            ))}

          {plan.kind === "rest" && (
            <>
              <div className={styles.restToday}>
                <div className={styles.badgeRest}>{t("ci.plan.plannedToday")}</div>
                <div className={styles.etRow}>
                  <div className={styles.restIcon}>🛋️</div>
                  <div>
                    <p className={styles.restTitle}>{t("ci.plan.restTitle")}</p>
                    <p className={styles.restSub}>{t("ci.plan.restSub")}</p>
                  </div>
                </div>
              </div>
              {!trainAnyway && (
                <button type="button" className={styles.trainAnyway} onClick={() => {
                    setTrainAnyway(true);
                    setMenuOpen(true);
                  }}>
                  {t("ci.plan.trainAnyway")}
                </button>
              )}
            </>
          )}

          {!hideSeanceRow && (
            <>
              <div className={styles.ql}>
                <i>🏋️</i> {t("ci.q.session")}{" "}
                <span className={isH ? styles.bh : styles.bf}>{plannedSeance && d.seance === plannedSeance ? t("ci.badge.planned") : t("ci.badge.required")}</span>
              </div>
              <SeancePicker
                groups={pickerGroups}
                value={d.seance}
                accordion={d.seanceAccordion}
                plannedValue={plan.kind === "day" ? plannedSeance : plan.kind === "rest" ? "__repos__" : undefined}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                onPick={onSelectChange}
              />
            </>
          )}

          {d.seanceAccordion === "repos" && d.accordionOpen && (
            <div className={styles.seanceAccordion}>
              <p className={styles.accLabel}>{t("ci.acc.rest")}</p>
              <div className={styles.opts}>
                {REPOS_SUBTYPES.map((o) => (
                  <div
                    key={o}
                    className={cx(styles.optBtn, d.seance === o && (isH ? styles.selH : styles.selF))}
                    onClick={() => chooseSubtype(o)}
                  >
                    {sportLabel(o, lang)}
                    {suggestedValues.has(o) && <span className={styles.suggestedTag}>{t("ci.badge.suggested")}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.seanceAccordion === "recup" && d.accordionOpen && (
            <div className={styles.seanceAccordion}>
              <p className={styles.accLabel}>{t("ci.acc.recup")}</p>
              <div className={styles.opts}>
                {RECUP_SUBTYPES.map((o) => (
                  <div
                    key={o}
                    className={cx(styles.optBtn, d.seance === o && (isH ? styles.selH : styles.selF))}
                    onClick={() => chooseSubtype(o)}
                  >
                    {sportLabel(o, lang)}
                    {suggestedValues.has(o) && <span className={styles.suggestedTag}>{t("ci.badge.suggested")}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showChosen && (
            <div className={styles.seanceChosen}>
              {t("ci.chosen")} <strong>{sportLabel(d.seance, lang)}</strong>
            </div>
          )}
        </div>

        {isVolumeBlock(d.seance) && (
          <div className={cx(styles.qc, d.volumeBlockFocus && (isH ? styles.onH : styles.onF))}>
            <div className={styles.ql}>
              <i>🎯</i> {t("ci.q.volumeFocus")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
            </div>
            <OptRow
              gender={g}
              options={VOLUME_FOCUS_OPTIONS.map((o) => o.label)}
              value={VOLUME_FOCUS_OPTIONS.find((o) => o.value === (d.volumeBlockFocus || suggestedVolumeFocus()))?.label ?? ""}
              onChange={(label) =>
                set({ volumeBlockFocus: VOLUME_FOCUS_OPTIONS.find((o) => o.label === label)?.value ?? "" })
              }
            />
            <div className={styles.dl} style={{ marginTop: 8 }}>
              {t("ci.volume.suggestion", { focus: optText(t, lang, VOLUME_FOCUS_OPTIONS.find((o) => o.value === suggestedVolumeFocus())?.label ?? "") })}
            </div>
          </div>
        )}

        {showPersonalize && (() => {
          const atHome = d.seance.includes("At Home");
          const durations = (atHome ? COACH_PARAMS.durationOptionsAtHome : COACH_PARAMS.durationOptions).map((m) => `${m} min`);
          const minutes = parseAvailableMinutes(d.seanceDuree);
          const proposed = minutes ? FORMAT_BY_MINUTES.find((f) => minutes <= f.maxMinutes)?.format : null;
          const formatLabel = (f: (typeof FORMAT_OPTIONS)[number]) => `${f.label} (${f.hint})`;
          return (
            <div className={styles.reqCard}>
              <button type="button" className={styles.reqHead} onClick={() => setDemandeOpen((v) => !v)} aria-expanded={demandeOpen}>
                <i className={styles.reqIcon}>🎛️</i>
                <span className={styles.reqTitle}>{t("ci.q.request")}</span>
                <span className={styles.reqBadge}>{t("ci.badge.optional")}</span>
                <span className={styles.reqChevron}>{demandeOpen ? "▴" : "▾"}</span>
              </button>
              <div className={styles.reqIntro}>{t("ci.req.default")}</div>

              {demandeOpen && (
                <>
                  <section className={styles.reqSec}>
                    <div className={styles.reqLabel}>{t("ci.req.duration")}</div>
                    <ReqGrid cols={durations.length} gender={g} options={durations} value={d.seanceDuree} dense onChange={(v) => set({ seanceDuree: d.seanceDuree === v ? "" : v })} />
                  </section>

                  <section className={styles.reqSec}>
                    <div className={styles.reqLabel}>{t("ci.req.format")}</div>
                    <ReqGrid
                      cols={1}
                      left
                      gender={g}
                      options={FORMAT_OPTIONS.map(formatLabel)}
                      value={FORMAT_OPTIONS.filter((f) => f.value === d.seanceFormat).map(formatLabel)[0] ?? ""}
                      onChange={(label) => {
                        const v = FORMAT_OPTIONS.find((f) => formatLabel(f) === label)?.value ?? "";
                        set({ seanceFormat: d.seanceFormat === v ? "" : v });
                      }}
                    />
                    {proposed && (
                      <div className={styles.reqHelp}>{t("ci.req.proposed", { format: t(FORMAT_OPTIONS.find((f) => f.value === proposed)?.nameKey ?? "ci.opt.fmtFullName") })}</div>
                    )}
                  </section>

                  <section className={styles.reqSec}>
                    <div className={styles.reqLabel}>{t("ci.req.focus")}</div>
                    <ReqGrid
                      cols={4}
                      gender={g}
                      options={[...(atHome ? FOCUS_AT_HOME_OPTIONS : FOCUS_MUSCLE_OPTIONS)]}
                      values={d.seanceFocus}
                      onChange={(v) =>
                        set({ seanceFocus: d.seanceFocus.includes(v) ? d.seanceFocus.filter((x) => x !== v) : [...d.seanceFocus, v] })
                      }
                    />
                    <div className={styles.reqHelp}>{atHome ? t("ci.req.focusHome") : t("ci.req.focusEcm")}</div>
                  </section>

                  <section className={styles.reqSec}>
                    <div className={styles.reqLabel}>{t("ci.req.equipment")}</div>
                    <ReqGrid
                      cols={3}
                      gender={g}
                      options={[...(atHome ? EQUIPMENT_OPTIONS_AT_HOME : EQUIPMENT_OPTIONS_ECM)]}
                      value={d.seanceEquipement}
                      onChange={(v) => set({ seanceEquipement: d.seanceEquipement === v ? "" : v })}
                    />
                    <div className={styles.reqHelp}>{t("ci.req.equipmentHint")}</div>
                  </section>

                  <section className={styles.reqSec}>
                    <div className={styles.reqLabel}>{t("ci.req.intensity")}</div>
                    <ReqGrid cols={4} dense gender={g} options={INTENSITE_OPTIONS} value={d.seanceIntensite} onChange={(v) => set({ seanceIntensite: d.seanceIntensite === v ? "" : v })} />
                  </section>

                  <section className={styles.reqSec}>
                    <div className={styles.reqLabel}>{t("ci.req.note")}</div>
                    <textarea
                      className={styles.reqNote}
                      placeholder={t("ci.req.notePlaceholder")}
                      value={d.seanceNote}
                      onChange={(e) => set({ seanceNote: e.target.value })}
                    />
                  </section>
                  {/* Zone à ménager et "Sans impact" : derrière FEATURE_FLAGS (6.3), désactivés tant qu'un coach et le juridique n'ont pas validé. */}
                  {atHome && FEATURE_FLAGS.sansImpact && (
                    <label className={styles.reqHelp} style={{ display: "flex", gap: 8, marginTop: 20 }}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          document.cookie = `${NO_IMPACT_COOKIE}=${e.target.checked ? "1" : ""}; path=/; max-age=${24 * 3600}; samesite=lax`;
                        }}
                      />
                      {t("ci.req.noImpact")}
                    </label>
                  )}
                  {FEATURE_FLAGS.zoneAMenager && (
                    <section className={styles.reqSec}>
                      <div className={styles.reqLabel}>{t("ci.req.zone")}</div>
                      <ReqGrid
                        cols={3}
                        gender={g}
                        options={[...ZONES]}
                        value=""
                        onChange={(v) => {
                          document.cookie = `${ZONE_COOKIE}=${encodeURIComponent(v)}; path=/; max-age=${24 * 3600}; samesite=lax`;
                        }}
                      />
                      <div className={styles.reqHelp}>{t("ci.req.zoneWarning")}</div>
                    </section>
                  )}
                </>
              )}
            </div>
          );
        })()}

        <div className={cx(styles.qc, d.travail !== null && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💼</i> {t("ci.q.work")} <span className={isH ? styles.bh : styles.bf}>{t("ci.badge.required")}</span>
          </div>
          <YesNo gender={g} value={d.travail} onChange={(v) => set({ travail: v })} />
        </div>

        {isH && (
          <div className={cx(styles.qc, d.soirPerformance !== null && styles.onH)}>
            <div className={styles.ql}>
              <i>🌙</i> {t("ci.q.evening")} <span className={styles.bh}>{t("ci.badge.required")}</span>
            </div>
            <YesNo gender={g} value={d.soirPerformance} onChange={(v) => set({ soirPerformance: v })} />
          </div>
        )}

        <SectionKicker number="05" title={t("ci.sec.05")} />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>{t("ci.sl.notes")}</div>
        <div className={cx(styles.qc, styles.opt)}>
          <div className={styles.ql}>
            <i>📝</i> {t("ci.q.observations")} <span className={styles.bo}>{t("ci.badge.optional")}</span>
          </div>
          <input type="text" placeholder={t("ci.notes.placeholder")} value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>

        <SectionKicker number="06" title={t("ci.sec.06")} />
        <div className={styles.progressWrapInline}>
          <div className={styles.progressLabels}>
            <span>{t("ci.progress", { n: filledFields, total: progressTotal })}</span>
            <span className={styles.pct}>{progressPct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className={cx(styles.liveState, liveState.cls && styles[liveState.cls])}>
          <div className={styles.lsLeft}>
            <span className={styles.lsEmoji}>{liveState.emoji}</span>
            <div>
              <p className={styles.lsTitle}>{liveState.title}</p>
              <p className={styles.lsSub}>{liveState.sub}</p>
            </div>
          </div>
          <span className={styles.lsTag}>{t("ci.live.tag")}</span>
        </div>

        <button className={styles.sub} disabled={submitting} onClick={handleSubmit}>
          {t("ci.submit")}
        </button>
      </div>
    </div>
  );
}

/** Titre de section — numéro en badge plein or, titre blanc, ligne dégradé
 * en dessous pour détacher la section du contenu qui suit (doc C.1 : le
 * numéro et le titre étaient auparavant en gris quasi invisible). */
function SectionKicker({ number, title }: { number: string; title: string }) {
  return (
    <div className={styles.kicker}>
      <div className={styles.kickerRow}>
        <span className={styles.kickerBadge}>{number}</span>
        <span className={styles.kickerTitle}>{title}</span>
      </div>
      <div className={styles.kickerLine} />
    </div>
  );
}

/** Grille régulière de choix de la carte « Une demande pour aujourd'hui ? » : mêmes hauteurs, 8 px d'écart. */
function ReqGrid({
  gender,
  options,
  value,
  values,
  cols,
  dense,
  left,
  onChange,
}: {
  gender: CheckinGender;
  options: string[];
  value?: string;
  values?: string[];
  cols: number;
  dense?: boolean;
  left?: boolean;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  return (
    <div className={styles.reqGrid} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = values ? values.includes(o) : value === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            className={cx(styles.reqBtn, dense && styles.reqBtnDense, left && styles.reqBtnLeft, on && (gender === "h" ? styles.reqSelH : styles.reqSelF))}
            onClick={() => onChange(o)}
          >
            {optText(t, lang, o)}
          </button>
        );
      })}
    </div>
  );
}

function OptRow({
  gender,
  options,
  value,
  onChange,
}: {
  gender: CheckinGender;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  return (
    <div className={styles.opts}>
      {options.map((o) => (
        <div
          key={o}
          className={cx(styles.optBtn, value === o && (gender === "h" ? styles.selH : styles.selF))}
          onClick={() => onChange(o)}
        >
          {optText(t, lang, o)}
        </div>
      ))}
    </div>
  );
}

function YesNo({
  gender,
  value,
  onChange,
}: {
  gender: CheckinGender;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <div className={styles.yn}>
      <div
        className={cx(styles.ynb, styles.y, value === true && (gender === "h" ? styles.selH : styles.selF))}
        onClick={() => onChange(true)}
      >
        {t("ci.yes")}
      </div>
      <div
        className={cx(styles.ynb, styles.n, value === false && (gender === "h" ? styles.selH : styles.selF))}
        onClick={() => onChange(false)}
      >
        {t("ci.no")}
      </div>
    </div>
  );
}

function Track({
  height,
  value,
  onPick,
  fillClass,
}: {
  height: 36 | 26;
  value: number | null;
  onPick: (v: number) => void;
  fillClass: string;
}) {
  return (
    <div className={styles.track} style={{ height }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
        <div
          key={i}
          className={cx(styles.bar, value !== null && i <= value && fillClass)}
          style={{ height: height === 36 ? 10 + i * 4 : 7 + i * 3 }}
          onClick={() => onPick(i)}
        />
      ))}
    </div>
  );
}
