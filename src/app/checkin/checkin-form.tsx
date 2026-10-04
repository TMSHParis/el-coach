"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitCheckin, type CheckinGender, type SleepPhotoAnalysis } from "./actions";
import { BackHomeButton } from "@/components/back-home-button";
import { REPOS_SUBTYPES, RECUP_SUBTYPES, isReposSubtype, isRecupSubtype } from "@/lib/seance-kinds";
import styles from "./checkin.module.css";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const ENERGIE_LABELS = ["", "Très bas", "Bas", "Faible", "Moyen−", "Moyen", "Moyen+", "Bien", "Très bien", "Excellent", "⚡ Max"];
const MOTIV_LABELS = ["", "Nulle", "Très basse", "Basse", "Faible", "Moyenne", "Correcte", "Bonne", "Très bonne", "Excellente", "🔥 Max"];

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
  {
    label: "🏃 COURS COLLECTIFS",
    options: ["Step", "CrossTraining", "CAF — Cuisse Abdo Fessier", "HIIT", "Cardio Boxe"].map((o) => ({ value: o, label: o })),
  },
  {
    label: "🥊 SPORTS DE COMBAT",
    options: ["🥊 Boxe Thaï / Muay Thai", "🥋 MMA", "🥊 Boxe anglaise", "🥋 Jiu-Jitsu brésilien", "🥋 Judo / Lutte"].map((o) => ({
      value: o,
      label: o,
    })),
  },
  { label: "🏃 CARDIO & ENDURANCE", options: ["🏃 Running", "🚴 Cyclisme", "🏊 Natation", "⛷️ Trail"].map((o) => ({ value: o, label: o })) },
  { label: "⚽ SPORTS COLLECTIFS", options: ["⚽ Football", "🏀 Basketball", "🏈 Rugby", "🎾 Tennis / Padel"].map((o) => ({ value: o, label: o })) },
  { label: "🧘 MOBILITÉ", options: ["🧘 Yoga / Pilates", "🤸 Calisthénie", "🧗 Escalade"].map((o) => ({ value: o, label: o })) },
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

const FOCUS_OPTIONS = ["Force", "Cardio", "Technique", "Mobilité", "Récupération active"];

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
const DUREE_OPTIONS = ["30 min", "45 min", "1h", "1h30", "2h+"];
const EQUIPEMENT_OPTIONS = ["Salle complète", "Maison", "Extérieur", "Salle limitée"];
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
  volumeBlockFocus: "",
};

const DATE_STR = new Date().toLocaleDateString("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Sentinelle de l'accordéon dans laquelle `value` (une fois choisie) retombe — null si ni repos ni récup. */
function accordionKindOf(value: string): "repos" | "recup" | null {
  if (isReposSubtype(value)) return "repos";
  if (isRecupSubtype(value)) return "recup";
  return null;
}

export function CheckinForm({
  programmes = [],
  habits = [],
  todayEcm = null,
  prevCheckin = null,
}: {
  programmes?: string[];
  /** 3 séances les plus fréquentes des 30 derniers jours (la plus fréquente en premier). */
  habits?: string[];
  /** Séance ECM programmée aujourd'hui, si un programme actif en a une — carte "Prévu aujourd'hui". */
  todayEcm?: { value: string; label: string; sub: string } | null;
  /** Rappel du dernier check-in réalisé (bandeau sous le header). */
  prevCheckin?: { dayLabel: string; stateLabel: string; seance: string | null; energie: number | null } | null;
}) {
  const router = useRouter();
  // Le groupe "Programmations ECM" se réduit aux programmes actifs de l'athlète
  // (choisis dans /settings) ; sans sélection enregistrée, le catalogue complet.
  const seanceGroups = buildSeanceGroups(programmes);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [d, setD] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [slowSubmit, setSlowSubmit] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

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

  const selectValue = d.seanceAccordion === "repos" ? "__repos__" : d.seanceAccordion === "recup" ? "__recup__" : d.seance;
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
    if (!sleepOk) miss.push("Sommeil");
    if (!d.recuperationPercue) miss.push("Récupération perçue");
    if (!d.jambes) miss.push("Jambes");
    if (d.douleur === null) miss.push("Douleur");
    if (!isH && d.cycle === null) miss.push("Cycle menstruel");
    if (!d.energie) miss.push("Énergie");
    if (!d.motivation) miss.push("Motivation");
    if (!d.mental) miss.push("Mental");
    if (!d.stress) miss.push("Stress");
    if (!d.libido) miss.push("Libido");
    if (!d.seance) miss.push("Séance");
    if (d.travail === null) miss.push("Travail");
    if (isH && d.soirPerformance === null) miss.push("Soir performance");
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
    Boolean(d.seance),
    d.travail !== null,
    isH ? d.soirPerformance !== null : true,
  ].filter(Boolean).length;
  const progressTotal = 13;
  const progressPct = Math.round((filledFields / progressTotal) * 100);

  // État live (⚪/🟢/🟡/🔴) — mêmes seuils que la suggestion contextuelle.
  const liveState = (() => {
    if (d.energie === null && d.mental === "") return { cls: "", emoji: "⚪", title: "En attente", sub: "Remplis le check-in pour voir ton état" };
    if ((d.energie !== null && d.energie <= 5) || d.mental === "🌫 Brouillard" || d.jambes === "🪨 Lourdes" || d.stress === "😰 Élevé" || cycleIntense) {
      return { cls: "red", emoji: "🔴", title: "Vigilance", sub: cycleIntense ? "Douleurs intenses détectées" : "Signes de fatigue accumulée" };
    }
    if ((d.energie !== null && d.energie <= 7) || d.stress === "😐 Modéré") {
      return { cls: "yellow", emoji: "🟡", title: "À surveiller", sub: "Journée à gérer avec soin" };
    }
    return { cls: "green", emoji: "🟢", title: "Ça part bien", sub: "État plutôt favorable" };
  })();

  async function handleSubmit() {
    const miss = validate();
    setMissing(miss);
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
      setMissing([
        offline
          ? "Pas de connexion internet détectée. Vérifie ta connexion puis réessaie."
          : "Le serveur n'a pas répondu. Tes réponses sont conservées — réessaie.",
      ]);
      return;
    }
    if (!result.ok) {
      setSubmitting(false);
      setMissing([result.error]);
      return;
    }
    // Page mindset intermédiaire (elle enchaîne sur le dashboard) — replace pour
    // que le retour depuis le dashboard ramène avant le check-in, pas au formulaire.
    router.replace("/mindset");
  }

  return (
    <div className={styles.checkinRoot}>
      {submitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>
            {slowSubmit ? "La génération prend un peu plus de temps que prévu…" : "Génération de ton plan..."}
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
          <div className={styles.datePill}>{DATE_STR}</div>
          <div className={cx(styles.sportBadge, isH ? styles.h : styles.f)}>
            {isH ? "♂ HOMME — CHECK-IN" : "♀ FEMME — CHECK-IN"}
          </div>
        </div>
      </div>

      {prevCheckin && (
        <div className={styles.prevCheckin}>
          {prevCheckin.dayLabel} : {prevCheckin.stateLabel}
          {prevCheckin.seance ? ` · ${prevCheckin.seance}` : ""}
          {prevCheckin.energie ? ` · Énergie ${prevCheckin.energie}/10` : ""}
        </div>
      )}

      {missing.length > 0 && (
        <div className={styles.errorBanner}>
          {missing.length === 1 && missing[0].startsWith("Vérifie")
            ? missing[0]
            : `Complète les champs : ${missing.join(", ")}`}
        </div>
      )}

      <div className={styles.genderTabs}>
        <div
          className={cx(styles.gtab, isH && styles.activeH)}
          onClick={() => set({ gender: "h" })}
        >
          ♂ HOMME
          <div className={styles.gtabSub}>Version masculine</div>
        </div>
        <div
          className={cx(styles.gtab, !isH && styles.activeF)}
          onClick={() => set({ gender: "f" })}
        >
          ♀ FEMME
          <div className={styles.gtabSub}>Version féminine</div>
        </div>
      </div>

      <div className={styles.fw}>
        <SectionKicker number="01" title="Récupération nocturne" />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>😴 Sommeil</div>
        <div className={cx(styles.qc, (d.sleepPhoto || d.sleepDuree) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>📱</i> Suivi sommeil <span className={isH ? styles.bh : styles.bf}>Requis</span>
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
                  <strong className={isH ? styles.h : styles.f}>Capture de ta montre connectée</strong>
                  Apple Watch, Garmin, Polar, Whoop...
                </div>
              </>
            )}
          </label>
          {d.sleepAnalyzing && (
            <div className={cx(styles.pok, isH ? styles.h : styles.f)}>⏳ Analyse de la photo...</div>
          )}
          {d.sleepPhoto && !d.sleepAnalyzing && (
            <div className={cx(styles.pok, isH ? styles.h : styles.f)}>
              {d.sleepAnalysis ? "✅ Photo analysée — champs pré-remplis" : "✅ Photo sommeil ajoutée"}
            </div>
          )}
          <div className={styles.orSep}>ou saisie manuelle</div>
          <div className={styles.smw}>
            <div className={styles.smt}>Entre tes données manuellement</div>
            <div className={styles.smg}>
              <div className={styles.smi}>
                <label>🌙 Coucher</label>
                <input type="text" placeholder="23h00" value={d.sleepCoucher} onChange={(e) => set({ sleepCoucher: e.target.value })} />
              </div>
              <div className={styles.smi}>
                <label>☀️ Réveil</label>
                <input type="text" placeholder="07h00" value={d.sleepReveil} onChange={(e) => set({ sleepReveil: e.target.value })} />
              </div>
              <div className={styles.smi}>
                <label>⏱️ Durée</label>
                <input type="text" placeholder="7h30" value={d.sleepDuree} onChange={(e) => set({ sleepDuree: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className={cx(styles.qc, d.recuperationPercue && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🔄</i> Récupération perçue <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={RECUP_PERCUE_OPTIONS} value={d.recuperationPercue} onChange={(v) => set({ recuperationPercue: v })} />
        </div>

        <SectionKicker number="02" title="État corporel" />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>🌅 Corps au réveil</div>
        <div className={cx(styles.qc, styles.opt, d.poids && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>⚖️</i> Poids ce matin <span className={styles.bo}>Facultatif</span>
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
            <i>🦵</i> État des jambes <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["🪶 Légères", "⚡ Légèrement lourdes", "🪨 Lourdes"]} value={d.jambes} onChange={(v) => set({ jambes: v })} />
        </div>

        <div className={cx(styles.qc, d.douleur !== null && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🤕</i> Douleur physique <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <YesNo gender={g} value={d.douleur} onChange={(v) => set({ douleur: v })} />
          {d.douleur && (
            <div style={{ marginTop: 9 }}>
              <input type="text" placeholder="Décris la douleur..." value={d.douleurTxt} onChange={(e) => set({ douleurTxt: e.target.value })} />
            </div>
          )}
        </div>

        {!isH && (
          <div className={cx(styles.qc, d.cycle !== null && styles.onF)} style={{ borderColor: "rgba(236,72,153,.2)" }}>
            <div className={styles.ql}>
              <i>🌸</i> Cycle menstruel en cours <span className={styles.bf}>Requis</span>
            </div>
            <YesNo gender={g} value={d.cycle} onChange={(v) => set({ cycle: v })} />
            {d.cycle && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: "var(--m)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>
                  💊 Douleurs menstruelles
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
                  📅 Jour du cycle
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
                  <span className={styles.nu}>/ ~28 jours</span>
                </div>
              </div>
            )}
          </div>
        )}

        <SectionKicker number="03" title="Vitalité" />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>⚡ Énergie & motivation</div>
        <div className={cx(styles.qc, Boolean(d.energie) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🔋</i> Énergie <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <div className={styles.sr}>
            <div className={cx(styles.sv, isH ? styles.h : styles.f)}>{d.energie ?? "—"}</div>
            <div className={styles.slr}>
              <span>{d.energie ? ENERGIE_LABELS[d.energie] : "Appuie sur une barre"}</span>/10
            </div>
          </div>
          <Track height={36} value={d.energie} onPick={(v) => set({ energie: v })} fillClass={isH ? styles.fh : styles.ff} />
        </div>

        <div className={cx(styles.qc, Boolean(d.motivation) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💥</i> Motivation <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <div className={styles.sr}>
            <div className={cx(styles.sv, styles.motiv)}>{d.motivation ?? "—"}</div>
            <div className={styles.slr}>
              <span>{d.motivation ? MOTIV_LABELS[d.motivation] : "Appuie sur une barre"}</span>/10
            </div>
          </div>
          <Track height={26} value={d.motivation} onPick={(v) => set({ motivation: v })} fillClass={styles.fm} />
        </div>

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>🧠 Mental &amp; Bien-être</div>
        <div className={cx(styles.qc, d.mental && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🧠</i> État mental <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["✨ Clair", "🌤 Moyen", "🌫 Brouillard"]} value={d.mental} onChange={(v) => set({ mental: v })} />
        </div>

        <div className={cx(styles.qc, d.stress && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>😤</i> Stress <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["😌 Faible", "😐 Modéré", "😰 Élevé"]} value={d.stress} onChange={(v) => set({ stress: v })} />
        </div>

        <div className={cx(styles.qc, d.libido && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>❤️</i> Libido <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["🔥 Bonne", "💛 Moyenne", "🩶 Basse"]} value={d.libido} onChange={(v) => set({ libido: v })} />
        </div>

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>🍽 Nutrition & hydratation</div>
        <div className={cx(styles.qc, styles.opt, d.nutrition && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🥗</i> Repas d&apos;hier soir <span className={styles.bo}>Facultatif</span>
          </div>
          <OptRow gender={g} options={NUTRITION_OPTIONS} value={d.nutrition} onChange={(v) => set({ nutrition: v })} />
        </div>
        <div className={cx(styles.qc, styles.opt, d.hydratation && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💧</i> Hydratation <span className={styles.bo}>Facultatif</span>
          </div>
          <OptRow gender={g} options={HYDRATATION_OPTIONS} value={d.hydratation} onChange={(v) => set({ hydratation: v })} />
        </div>

        <SectionKicker number="04" title="Programmation du jour" />
        <div className={cx(styles.sl, styles.gold)}>🏋️ Ton activité du jour</div>
        <div className={cx(styles.qc, d.seance && (isH ? styles.onH : styles.onF))}>
          {habits.length > 0 && (
            <>
              <div className={styles.freqLabel}>Tes habitudes</div>
              <div className={styles.freqRow}>
                {habits.map((h) => (
                  <div key={h} className={styles.freqItem} onClick={() => chooseSeance(h)}>
                    <p>{h}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {todayEcm && (
            <div className={styles.ecmToday} onClick={() => chooseSeance(todayEcm.value)}>
              <div className={styles.badgeToday}>PRÉVU AUJOURD&apos;HUI</div>
              <div className={styles.etRow}>
                <div className={styles.etIcon}>⚡</div>
                <div>
                  <p className={styles.etTitle}>{todayEcm.label}</p>
                  <p className={styles.etSub}>{todayEcm.sub}</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.ql}>
            <i>🏋️</i> Séance du jour <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <select className={styles.ss} value={selectValue} onChange={(e) => onSelectChange(e.target.value)}>
            <option value="" disabled>
              Choisir ta séance...
            </option>
            {seanceGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {d.seanceAccordion === "repos" && d.accordionOpen && (
            <div className={styles.seanceAccordion}>
              <p className={styles.accLabel}>😴 Choisis ton type de repos</p>
              <div className={styles.opts}>
                {REPOS_SUBTYPES.map((o) => (
                  <div
                    key={o}
                    className={cx(styles.optBtn, d.seance === o && (isH ? styles.selH : styles.selF))}
                    onClick={() => chooseSubtype(o)}
                  >
                    {o}
                    {suggestedValues.has(o) && <span className={styles.suggestedTag}>SUGGÉRÉ</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.seanceAccordion === "recup" && d.accordionOpen && (
            <div className={styles.seanceAccordion}>
              <p className={styles.accLabel}>🚶 Choisis ta récupération active</p>
              <div className={styles.opts}>
                {RECUP_SUBTYPES.map((o) => (
                  <div
                    key={o}
                    className={cx(styles.optBtn, d.seance === o && (isH ? styles.selH : styles.selF))}
                    onClick={() => chooseSubtype(o)}
                  >
                    {o}
                    {suggestedValues.has(o) && <span className={styles.suggestedTag}>SUGGÉRÉ</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showChosen && (
            <div className={styles.seanceChosen}>
              ✓ Choix retenu : <strong>{d.seance}</strong>
            </div>
          )}
        </div>

        {isVolumeBlock(d.seance) && (
          <div className={cx(styles.qc, d.volumeBlockFocus && (isH ? styles.onH : styles.onF))}>
            <div className={styles.ql}>
              <i>🎯</i> Focus Volume Block <span className={isH ? styles.bh : styles.bf}>Requis</span>
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
              Suggestion du jour : {VOLUME_FOCUS_OPTIONS.find((o) => o.value === suggestedVolumeFocus())?.label}
            </div>
          </div>
        )}

        {showPersonalize && (
          <div className={cx(styles.qc, styles.opt)}>
            <div className={styles.ql}>
              <i>🎛️</i> Personnaliser ma séance <span className={styles.bo}>Facultatif</span>
            </div>

            <div className={styles.dl}>Focus du jour</div>
            <MultiOptRow gender={g} options={FOCUS_OPTIONS} values={d.seanceFocus} onToggle={(v) => set({
              seanceFocus: d.seanceFocus.includes(v) ? d.seanceFocus.filter((x) => x !== v) : [...d.seanceFocus, v],
            })} />

            <div className={styles.dl} style={{ marginTop: 10 }}>Durée disponible</div>
            <OptRow gender={g} options={DUREE_OPTIONS} value={d.seanceDuree} onChange={(v) => set({ seanceDuree: v })} />

            <div className={styles.dl} style={{ marginTop: 10 }}>Équipement disponible aujourd&apos;hui</div>
            <OptRow gender={g} options={EQUIPEMENT_OPTIONS} value={d.seanceEquipement} onChange={(v) => set({ seanceEquipement: v })} />

            <div className={styles.dl} style={{ marginTop: 10 }}>Intensité souhaitée</div>
            <OptRow gender={g} options={INTENSITE_OPTIONS} value={d.seanceIntensite} onChange={(v) => set({ seanceIntensite: v })} />

            <div className={styles.dl} style={{ marginTop: 10 }}>Note libre sur la séance</div>
            <textarea
              className={styles.ta}
              placeholder="ex : Je veux travailler les épaules · Pas de deadlift aujourd'hui"
              value={d.seanceNote}
              onChange={(e) => set({ seanceNote: e.target.value })}
            />
          </div>
        )}

        <div className={cx(styles.qc, d.travail !== null && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💼</i> Journée de travail <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <YesNo gender={g} value={d.travail} onChange={(v) => set({ travail: v })} />
        </div>

        {isH && (
          <div className={cx(styles.qc, d.soirPerformance !== null && styles.onH)}>
            <div className={styles.ql}>
              <i>🌙</i> Soir performance <span className={styles.bh}>Requis</span>
            </div>
            <YesNo gender={g} value={d.soirPerformance} onChange={(v) => set({ soirPerformance: v })} />
          </div>
        )}

        <SectionKicker number="05" title="Observations" />
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>📝 Notes</div>
        <div className={cx(styles.qc, styles.opt)}>
          <div className={styles.ql}>
            <i>📝</i> Observations <span className={styles.bo}>Facultatif</span>
          </div>
          <input type="text" placeholder="Ressenti particulier, événement..." value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>

        <SectionKicker number="06" title="Validation" />
        <div className={styles.progressWrapInline}>
          <div className={styles.progressLabels}>
            <span>{filledFields} / {progressTotal} sections</span>
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
          <span className={styles.lsTag}>Provisoire</span>
        </div>

        <button className={styles.sub} disabled={submitting} onClick={handleSubmit}>
          ⚡ VALIDER MON CHECK-IN
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
  return (
    <div className={styles.opts}>
      {options.map((o) => (
        <div
          key={o}
          className={cx(styles.optBtn, value === o && (gender === "h" ? styles.selH : styles.selF))}
          onClick={() => onChange(o)}
        >
          {o}
        </div>
      ))}
    </div>
  );
}

function MultiOptRow({
  gender,
  options,
  values,
  onToggle,
}: {
  gender: CheckinGender;
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className={styles.opts}>
      {options.map((o) => (
        <div
          key={o}
          className={cx(styles.optBtn, values.includes(o) && (gender === "h" ? styles.selH : styles.selF))}
          onClick={() => onToggle(o)}
        >
          {o}
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
  return (
    <div className={styles.yn}>
      <div
        className={cx(styles.ynb, styles.y, value === true && (gender === "h" ? styles.selH : styles.selF))}
        onClick={() => onChange(true)}
      >
        ✓ OUI
      </div>
      <div
        className={cx(styles.ynb, styles.n, value === false && (gender === "h" ? styles.selH : styles.selF))}
        onClick={() => onChange(false)}
      >
        ✗ NON
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
