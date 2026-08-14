"use client";

import { useState } from "react";
import Link from "next/link";
import { submitEcmSignup, type EcmProfileCookie, type EcmSport } from "./actions";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import styles from "./ecm-signup.module.css";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

// ============================================================================
// Données statiques
// ============================================================================

const LEFT_PROGRAMS: { name: string; tag: string }[] = [
  { name: "CrossFit Pure", tag: "Force · Olympique · Metcon" },
  { name: "Hybrid Engine", tag: "CrossFit · Muscu · Adaptatif" },
  { name: "Hyrox Pure", tag: "Stations · Course · Compétition" },
  { name: "Volume Block Hypertrophy", tag: "Split · Volume · Progression" },
  { name: "At Home", tag: "Bodyweight · Accessible · Run" },
];

const SPORT_LABEL_TO_SLUG: Record<string, string> = {
  "⚡ CrossFit Pure": "crossfit-pure",
  "🔥 Hybrid Engine": "hybrid-cf-strength",
  "🏁 Hyrox Pure": "hyrox-pure",
  "💪 Volume Block Hypertrophy": "volume-block-hypertrophy",
  "🏠 At Home": "at-home",
};

const SLUG_TO_SPORT_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SPORT_LABEL_TO_SLUG).map(([label, slug]) => [slug, label]),
);

const DAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const LEVELS = ["🌱 Débutant", "📈 Intermédiaire", "🔥 Avancé", "⚡ Élite"];

const OBJECTIFS = [
  "🔥 Réduire la graisse corporelle",
  "💪 Gagner de la masse musculaire",
  "🏆 Améliorer mes performances sportives",
  "⚡ Recomposition corporelle",
  "🧘 Bien-être général",
];

const EQUIPEMENTS = [
  "🏋️ Salle complète",
  "🏠 Maison (équipement limité)",
  "🌳 Extérieur / Calisthénie",
  "🔄 Les deux (salle + maison)",
];

const RESTRICTIONS = [
  "Aucune restriction",
  "🥛 Intolérance lactose",
  "🌾 Gluten",
  "🐖 Pas de porc",
  "🍖 Végétarien",
  "🌱 Vegan",
  "🤢 Problèmes digestifs",
];

const COMPLEMENTS = [
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

const SPORT_OPTGROUPS: { label: string; options: string[] }[] = [
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

const LANDING_STEPS = [
  { n: "01", name: "Check-in du matin", desc: "2 minutes. Énergie, sommeil, corps, mental. Le Coaching Adaptatif lit ton état réel." },
  { n: "02", name: "Analyse instantanée", desc: "En moins de 5 secondes, le système croise tes données et génère ton plan du jour." },
  { n: "03", name: "Plan sur mesure", desc: "Séance adaptée, stack compléments, en-cas, récupération ciblée. Zéro générique." },
  { n: "04", name: "Aperçu demain", desc: "Prépare ta prochaine séance, ton en-cas et ton heure de coucher recommandée." },
];

const EMPTY_SPORT: EcmSport = { nom: "", jours: [], h: "", du: "", niv: "" };

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profile: EcmProfileCookie;
  cardNumber: string;
  cardholder: string;
  expiry: string;
  cvv: string;
  cgv: boolean;
  remind: boolean;
};

function emptyProfile(preselectedSport: string): EcmProfileCookie {
  return {
    prenom: "",
    age: "",
    taille: "",
    poids: "",
    obj: "",
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

// ============================================================================
// Composant principal
// ============================================================================

export function EcmSignupForm({ defaultProgramSlug }: { defaultProgramSlug: string }) {
  const preselectedSport = SLUG_TO_SPORT_LABEL[defaultProgramSlug] ?? "";

  const [phase, setPhase] = useState<"landing" | "form">("landing");
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [mainStep, setMainStep] = useState<1 | 2 | 3>(1);
  const [ecmSubStep, setEcmSubStep] = useState<1 | 2 | 3 | 4>(1);
  const [data, setData] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    profile: emptyProfile(preselectedSport),
    cardNumber: "",
    cardholder: "",
    expiry: "",
    cvv: "",
    cgv: false,
    remind: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [cgvError, setCgvError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const profile = data.profile;
  const setProfile = (patch: Partial<EcmProfileCookie>) =>
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));

  const titles = ["Créer un compte", "Ton profil athlète", "Free Trial — 7 jours"];
  const subs = [
    <>
      Déjà inscrit ? <a href="#">Se connecter</a>
    </>,
    "Personnalise ton expérience EL COACH.",
    "Aucun débit avant la fin de ton essai.",
  ];
  const ecmLabels = ["Profil personnel", "Profil sportif", "Nutrition & Jeûne", "Santé & Compléments"];

  function goToStep1to2() {
    const okFirst = data.firstName.trim().length > 0;
    const okEmail = data.email.includes("@");
    setFirstNameError(!okFirst);
    setEmailError(!okEmail);
    if (!okFirst || !okEmail) return;
    setMainStep(2);
  }

  function ecmGo(from: 1 | 2 | 3 | 4) {
    const next = (from + 1) as 2 | 3 | 4;
    setEcmSubStep(next);
  }

  function ecmBack(from: 2 | 3 | 4) {
    if (from === 2) {
      setMainStep(1);
      return;
    }
    setEcmSubStep((from - 1) as 1 | 2 | 3);
  }

  function toggleDay(sport: "s1" | "s2", day: string) {
    const jours = profile[sport].jours;
    const next = jours.includes(day) ? jours.filter((d) => d !== day) : [...jours, day];
    setProfile({ [sport]: { ...profile[sport], jours: next } } as Partial<EcmProfileCookie>);
  }

  function setSportField(sport: "s1" | "s2", patch: Partial<EcmSport>) {
    setProfile({ [sport]: { ...profile[sport], ...patch } } as Partial<EcmProfileCookie>);
  }

  function toggleMulti(key: "rest" | "comp", value: string) {
    const arr = profile[key];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setProfile({ [key]: next } as Partial<EcmProfileCookie>);
  }

  function formatCard(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1  ").trim();
  }

  function formatExpiry(raw: string) {
    let digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) digits = digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function pwStrength(pw: string): "weak" | "medium" | "strong" | null {
    if (pw.length === 0) return null;
    if (pw.length < 6) return "weak";
    if (pw.length < 10) return "medium";
    return "strong";
  }

  async function handleSubmit() {
    if (!data.cgv) {
      setCgvError(true);
      setTimeout(() => setCgvError(false), 1500);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const matchedSlug = SPORT_LABEL_TO_SLUG[profile.s1.nom] ?? defaultProgramSlug;
    const result = await submitEcmSignup({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      programSlug: matchedSlug,
      profile,
      cardNumber: data.cardNumber,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setSuccess(result.firstName || data.firstName || "Athlète");
  }

  if (success) {
    return (
      <div className={cx(styles.ecmRoot, styles.page)}>
        <LeftPanel />
        <div className={styles.right}>
          <div className={styles.successScreen + " " + styles.active}>
            <div className={styles.successCheck}>✓</div>
            <h2 className={styles.successTitle}>
              Bienvenue, <span className={styles.successName}>{success}.</span>
            </h2>
            <p className={styles.successSub}>
              Ton <strong>Free Trial de 7 jours</strong> démarre maintenant.
              <br />
              Aucun débit avant la fin de l&apos;essai.
            </p>
            <Link href="/checkin" className={styles.btnDashboard}>
              Commencer mon check-in →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "landing") {
    return (
      <div className={cx(styles.ecmRoot, styles.landing)}>
        <div className={styles.landingLogo}>
          EL <span>COACH</span>
        </div>
        <div className={styles.landingBadge}>Free Trial — 7 jours offerts</div>
        <h1 className={styles.landingTitle}>
          Inscription Free Trial
          <br />7 jours offerts
        </h1>
        <p className={styles.landingPrice}>
          Ton Coaching Adaptatif à <strong>{formatPrice(PROGRAM_BASE_PRICE_CENTS)} / mois</strong>
        </p>

        <div className={cx(styles.accordion, accordionOpen && styles.open)}>
          <button className={styles.accordionToggle} type="button" onClick={() => setAccordionOpen((v) => !v)}>
            Cliquer pour en savoir plus
            <span className={styles.accordionIcon}>▾</span>
          </button>
          <div className={styles.accordionContent}>
            {LANDING_STEPS.map((s) => (
              <div key={s.n} className={styles.stepItem}>
                <div className={styles.stepNum}>{s.n}</div>
                <div>
                  <div className={styles.stepName}>{s.name}</div>
                  <div className={styles.stepDesc}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className={styles.btnLetsgo} type="button" onClick={() => setPhase("form")}>
          LET&apos;S GO ⚡
        </button>

        <p className={styles.landingSecure}>
          🔒 Carte enregistrée en garantie · Aucun débit avant J+7 · Annulation en un clic
        </p>
      </div>
    );
  }

  const strength = pwStrength(data.password);

  return (
    <div className={cx(styles.ecmRoot, styles.page)}>
      <LeftPanel />

      <div className={styles.right}>
        <div className={styles.formHeader}>
          <div className={styles.formStepIndicator}>
            <div className={styles.stepDots}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={cx(styles.stepDot, n <= mainStep && styles.active)} />
              ))}
            </div>
            <span>Étape {mainStep} sur 3</span>
          </div>
          <h2 className={styles.formTitle}>{titles[mainStep - 1]}</h2>
          <p className={styles.formSubtitle}>{subs[mainStep - 1]}</p>
        </div>

        {submitError && (
          <div className="mb-4 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {submitError}
          </div>
        )}

        {/* ══ STEP 1 — COMPTE ══ */}
        <div className={cx(styles.stepWrap, mainStep === 1 && styles.active)}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Prénom</label>
              <input
                type="text"
                placeholder="Prénom"
                value={data.firstName}
                onChange={(e) => setData((d) => ({ ...d, firstName: e.target.value }))}
                className={firstNameError ? styles.fieldError : undefined}
              />
              {firstNameError && <span className={cx(styles.fieldHint, styles.errorMsg, styles.show)}>Champ requis</span>}
            </div>
            <div className={styles.field}>
              <label>Nom</label>
              <input
                type="text"
                placeholder="Nom"
                value={data.lastName}
                onChange={(e) => setData((d) => ({ ...d, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="email@exemple.com"
              value={data.email}
              onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
              className={emailError ? styles.fieldError : undefined}
            />
            {emailError && <span className={cx(styles.fieldHint, styles.errorMsg, styles.show)}>Email invalide</span>}
          </div>
          <div className={styles.field}>
            <label>Mot de passe</label>
            <div className={styles.fieldPw}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 caractères"
                value={data.password}
                onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
              />
              <button className={styles.pwToggle} type="button" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? "CACHER" : "VOIR"}
              </button>
            </div>
            <div className={styles.pwStrength}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cx(
                    styles.pwBar,
                    strength === "weak" && i === 0 && styles.weak,
                    strength === "medium" && i < 2 && styles.medium,
                    strength === "strong" && styles.strong,
                  )}
                />
              ))}
            </div>
          </div>
          <button className={styles.btnNext} type="button" onClick={goToStep1to2}>
            Continuer <span className={styles.arrow}>→</span>
          </button>
        </div>

        {/* ══ STEP 2 — PROFIL ECM ══ */}
        <div className={cx(styles.stepWrap, mainStep === 2 && styles.active)}>
          <div className={styles.ecmProgress}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={cx(styles.ecmPb, n < ecmSubStep && styles.done, n === ecmSubStep && styles.cur)}
              />
            ))}
          </div>
          <div className={styles.ecmPl}>
            {ecmLabels[ecmSubStep - 1]} · {ecmSubStep} / 4
          </div>

          {/* Sous-étape 1 — Profil personnel */}
          <div className={cx(styles.ecmStep, ecmSubStep === 1 && styles.active)}>
            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>👤</i> Prénom &amp; Âge
              </div>
              <div className={styles.nr} style={{ gap: 8, marginBottom: 8 }}>
                <input
                  className={styles.ecmInput}
                  type="text"
                  placeholder="Ton prénom..."
                  style={{ flex: 2 }}
                  value={profile.prenom}
                  onChange={(e) => setProfile({ prenom: e.target.value })}
                />
                <input
                  className={cx(styles.ecmInput, styles.ecmNum)}
                  type="number"
                  placeholder="—"
                  min={16}
                  max={80}
                  style={{ flex: 1 }}
                  value={profile.age}
                  onChange={(e) => setProfile({ age: e.target.value })}
                />
                <span className={styles.nu}>ans</span>
              </div>
            </div>
            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>📏</i> Morphologie
              </div>
              <div className={styles.nr} style={{ gap: 8 }}>
                <input
                  className={cx(styles.ecmInput, styles.ecmNum)}
                  type="number"
                  placeholder="—"
                  min={140}
                  max={220}
                  style={{ flex: 1 }}
                  value={profile.taille}
                  onChange={(e) => setProfile({ taille: e.target.value })}
                />
                <span className={styles.nu}>cm</span>
                <input
                  className={cx(styles.ecmInput, styles.ecmNum)}
                  type="number"
                  placeholder="—"
                  min={40}
                  max={200}
                  step={0.1}
                  style={{ flex: 1 }}
                  value={profile.poids}
                  onChange={(e) => setProfile({ poids: e.target.value })}
                />
                <span className={styles.nu}>kg</span>
              </div>
            </div>
            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>🎯</i> Objectif principal
              </div>
              <MoSolo options={OBJECTIFS} value={profile.obj} onChange={(v) => setProfile({ obj: v })} />
            </div>
            <button className={styles.btnSubNext} type="button" onClick={() => ecmGo(1)}>
              Suivant → Profil sportif
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => setMainStep(1)}>
              ← Retour compte
            </button>
          </div>

          {/* Sous-étape 2 — Profil sportif */}
          <div className={cx(styles.ecmStep, ecmSubStep === 2 && styles.active)}>
            <SportBlock title="⚡ SPORT PRINCIPAL" sport={profile.s1} onField={(p) => setSportField("s1", p)} onDay={(d) => toggleDay("s1", d)} />

            {profile.s2on && (
              <SportBlock
                title="🥈 SPORT SECONDAIRE"
                sport={profile.s2}
                onField={(p) => setSportField("s2", p)}
                onDay={(d) => toggleDay("s2", d)}
                onRemove={() =>
                  setProfile({ s2on: false, s2: { ...EMPTY_SPORT } })
                }
              />
            )}
            {!profile.s2on && (
              <button
                className={styles.asb}
                type="button"
                onClick={() => setProfile({ s2on: true })}
              >
                + AJOUTER UN 2ÈME SPORT
              </button>
            )}

            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>🏗️</i> Accès équipement
              </div>
              <MoSolo options={EQUIPEMENTS} value={profile.equip} onChange={(v) => setProfile({ equip: v })} />
            </div>

            <button className={styles.btnSubNext} type="button" onClick={() => ecmGo(2)}>
              Suivant → Nutrition
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => ecmBack(2)}>
              ← Retour
            </button>
          </div>

          {/* Sous-étape 3 — Nutrition */}
          <div className={cx(styles.ecmStep, ecmSubStep === 3 && styles.active)}>
            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>⏱️</i> Jeûne intermittent ?
              </div>
              <YesNo value={profile.jeune} onChange={(v) => setProfile({ jeune: v })} />
              {profile.jeune && (
                <div style={{ marginTop: 10 }}>
                  <div className={styles.dl}>Type de jeûne</div>
                  <div className={styles.opts} style={{ marginBottom: 10 }}>
                    {["16:8", "18:6", "20:4", "Autre"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        className={cx(styles.opt, profile.tj === o && styles.sel)}
                        onClick={() => setProfile({ tj: o })}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  <div className={styles.dl}>Fenêtre alimentaire</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      className={styles.mi}
                      type="text"
                      placeholder="12h00"
                      style={{ flex: 1 }}
                      value={profile.df}
                      onChange={(e) => setProfile({ df: e.target.value })}
                    />
                    <span style={{ fontFamily: "var(--font-bebas)", fontSize: "1.2rem", color: "var(--accent)" }}>→</span>
                    <input
                      className={styles.mi}
                      type="text"
                      placeholder="20h00"
                      style={{ flex: 1 }}
                      value={profile.ff}
                      onChange={(e) => setProfile({ ff: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>
                🚫 Restrictions / Allergies <span className={styles.hint}>(plusieurs choix)</span>
              </div>
              <MoMulti options={RESTRICTIONS} values={profile.rest} onToggle={(v) => toggleMulti("rest", v)} />
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>💧 Hydratation quotidienne</div>
              <div className={styles.opts}>
                {["Moins de 1.5L", "1.5 - 2L", "2 - 3L", "Plus de 3L"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={cx(styles.opt, profile.hydra === o && styles.sel)}
                    onClick={() => setProfile({ hydra: o })}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.btnSubNext} type="button" onClick={() => ecmGo(3)}>
              Suivant → Santé &amp; Compléments
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => ecmBack(3)}>
              ← Retour
            </button>
          </div>

          {/* Sous-étape 4 — Santé & Compléments */}
          <div className={cx(styles.ecmStep, ecmSubStep === 4 && styles.active)}>
            <div className={styles.qc}>
              <div className={styles.ql}>🤕 Blessures chroniques ?</div>
              <YesNo value={profile.bles} onChange={(v) => setProfile({ bles: v })} />
              {profile.bles && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className={styles.ecmTa}
                    placeholder="Décris tes blessures... (ex: tendinite épaule, lombaires...)"
                    value={profile.bt}
                    onChange={(e) => setProfile({ bt: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>
                💊 Compléments alimentaires <span className={styles.hint}>(plusieurs choix)</span>
              </div>
              <MoMulti options={COMPLEMENTS} values={profile.comp} onToggle={(v) => toggleMulti("comp", v)} />
              <div style={{ marginTop: 8 }}>
                <div className={styles.dl}>➕ Autres</div>
                <input
                  className={styles.ecmInput}
                  type="text"
                  placeholder="ex: Curcuma, Rhodiola..."
                  value={profile.ca}
                  onChange={(e) => setProfile({ ca: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>😴 Qualité de sommeil</div>
              <div className={styles.opts}>
                {["😴 Très bonne", "🌤 Correcte", "😓 Difficile", "😫 Très mauvaise"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={cx(styles.opt, profile.qs === o && styles.sel)}
                    onClick={() => setProfile({ qs: o })}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>⏰ Durée de sommeil moyenne</div>
              <div className={styles.opts}>
                {["Moins de 6h", "6h - 7h", "7h - 8h", "Plus de 8h"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={cx(styles.opt, profile.ds === o && styles.sel)}
                    onClick={() => setProfile({ ds: o })}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.btnNext} type="button" style={{ marginTop: 16 }} onClick={() => setMainStep(3)}>
              Continuer vers le paiement <span className={styles.arrow}>→</span>
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => ecmBack(4)}>
              ← Retour
            </button>
          </div>
        </div>

        {/* ══ STEP 3 — PAIEMENT ══ */}
        <div className={cx(styles.stepWrap, mainStep === 3 && styles.active)}>
          <div className={styles.trialReminder}>
            <div className={styles.trialReminderIcon}>⚡</div>
            <div className={styles.trialReminderText}>
              <strong>Free Trial — 7 jours gratuits.</strong>
              <br />
              Carte enregistrée en garantie. Aucun débit avant J+7. Annulation en un clic.
            </div>
          </div>

          <div className={styles.cardSection}>
            <span className={styles.cardLabel}>Informations de paiement</span>
            <div className={styles.cardMock}>
              <div className={styles.cardRowTop}>
                <div className={styles.cardChip} />
                <div className={styles.cardBrands}>
                  <span className={styles.cardBrand}>VISA</span>
                  <span className={styles.cardBrand} style={{ fontSize: "0.7rem" }}>
                    MC
                  </span>
                </div>
              </div>
              <input
                className={styles.cardNumberInput}
                type="text"
                placeholder="0000  0000  0000  0000"
                maxLength={22}
                value={data.cardNumber}
                onChange={(e) => setData((d) => ({ ...d, cardNumber: formatCard(e.target.value) }))}
              />
              <div className={styles.cardRowBottom}>
                <div className={styles.cardMiniField}>
                  <span className={styles.cardMiniLabel}>Titulaire</span>
                  <input
                    className={styles.cardMiniInput}
                    type="text"
                    placeholder="NOM PRÉNOM"
                    value={data.cardholder}
                    onChange={(e) => setData((d) => ({ ...d, cardholder: e.target.value }))}
                  />
                </div>
                <div className={styles.cardMiniField}>
                  <span className={styles.cardMiniLabel}>Expiration</span>
                  <input
                    className={styles.cardMiniInput}
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={data.expiry}
                    onChange={(e) => setData((d) => ({ ...d, expiry: formatExpiry(e.target.value) }))}
                  />
                </div>
                <div className={styles.cardMiniField}>
                  <span className={styles.cardMiniLabel}>CVV</span>
                  <input
                    className={styles.cardMiniInput}
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={data.cvv}
                    onChange={(e) => setData((d) => ({ ...d, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                </div>
              </div>
            </div>
            <div className={styles.secureNote}>Paiement sécurisé SSL 256-bit — aucun débit pendant 7 jours</div>
          </div>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={data.cgv}
              onChange={(e) => setData((d) => ({ ...d, cgv: e.target.checked }))}
            />
            <div className={styles.checkBox} style={cgvError ? { borderColor: "var(--error)" } : undefined} />
            <span className={styles.checkText}>
              J&apos;accepte les <a href="#">conditions générales</a> et la <a href="#">politique de confidentialité</a>.
            </span>
          </label>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={data.remind}
              onChange={(e) => setData((d) => ({ ...d, remind: e.target.checked }))}
            />
            <div className={styles.checkBox} />
            <span className={styles.checkText}>Me rappeler 24h avant la fin de mon essai gratuit.</span>
          </label>

          <button className={styles.btnNext} type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Création en cours…" : "Démarrer mon Free Trial"} <span className={styles.arrow}>→</span>
          </button>
          <button className={styles.btnBack} type="button" onClick={() => setMainStep(2)}>
            ← Retour profil
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sous-composants
// ============================================================================

function LeftPanel() {
  return (
    <div className={styles.left}>
      <div className={styles.logo}>
        EL <span>COACH</span>
      </div>

      <div className={styles.leftHero}>
        <div className={styles.leftBadge}>Free Trial — 7 jours offerts</div>
        <h1 className={styles.leftTitle}>
          Commence
          <span className={styles.accentLine}>maintenant.</span>
        </h1>
        <p className={styles.leftSub}>
          Ton Coaching Adaptatif, ta séance du jour — <strong>tout de suite.</strong>
          <br />
          Aucun débit avant la fin de ton essai. Annulation en un clic.
        </p>

        <div className={styles.programsList}>
          {LEFT_PROGRAMS.map((p) => (
            <div key={p.name} className={styles.progItem}>
              <div className={styles.progDot} />
              <span className={styles.progItemName}>{p.name}</span>
              <span className={styles.progItemTag}>{p.tag}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.trialBanner}>
        <div className={styles.trialIcon}>⚡</div>
        <div>
          <div className={styles.trialTitle}>FREE TRIAL</div>
          <div className={styles.trialDesc}>
            7 jours gratuits · Carte enregistrée en garantie
            <br />
            Aucun débit · Annulation en un clic
          </div>
        </div>
      </div>
    </div>
  );
}

function MoSolo({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <>
      {options.map((o) => (
        <div
          key={o}
          className={cx(styles.mo, value === o && styles.sel)}
          onClick={() => onChange(o)}
        >
          <div className={styles.mc}>{value === o ? "✓" : ""}</div>
          {o}
        </div>
      ))}
    </>
  );
}

function MoMulti({
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
        <div
          key={o}
          className={cx(styles.mo, values.includes(o) && styles.sel)}
          onClick={() => onToggle(o)}
        >
          <div className={styles.mc}>{values.includes(o) ? "✓" : ""}</div>
          {o}
        </div>
      ))}
    </>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className={styles.yn}>
      <div
        className={cx(styles.ynb, styles.y, value === true && styles.sel)}
        onClick={() => onChange(true)}
      >
        ✓ OUI
      </div>
      <div
        className={cx(styles.ynb, styles.n, value === false && styles.sel)}
        onClick={() => onChange(false)}
      >
        ✗ NON
      </div>
    </div>
  );
}

function SportBlock({
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
          <div
            key={d}
            className={cx(styles.db, sport.jours.includes(d) && styles.sel)}
            onClick={() => onDay(d)}
          >
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
          <div
            key={l}
            className={cx(styles.lbb, sport.niv === l && styles.sel)}
            onClick={() => onField({ niv: l })}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
