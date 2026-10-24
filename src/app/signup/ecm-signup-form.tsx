"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { clerkEnabledClient } from "@/lib/clerk";
import { useT } from "@/lib/i18n/provider";
import { dv } from "./display";
import { submitEcmSignup, type EcmProfileCookie } from "./actions";
import {
  cx,
  LEFT_PROGRAMS,
  SPORT_LABEL_TO_SLUG,
  SLUG_TO_SPORT_LABEL,
  EQUIPEMENTS,
  RESTRICTIONS,
  COMPLEMENTS,
  emptyEcmProfile,
  validatePassword,
  MoSolo,
  MoMulti,
  ObjectifsPicker,
  ProgrammePrincipalPicker,
  WeekCyclePicker,
  YesNo,
} from "./ecm-shared";
import styles from "./ecm-signup.module.css";

// ============================================================================
// Données statiques
// ============================================================================

const LANDING_STEPS = [
  { n: "01", name: "su.guide.step1.name", desc: "su.form.landingStep1.desc" },
  { n: "02", name: "su.guide.step2.name", desc: "su.form.landingStep2.desc" },
  { n: "03", name: "su.guide.step3.name", desc: "su.form.landingStep3.desc" },
  { n: "04", name: "su.form.landingStep4.name", desc: "su.form.landingStep4.desc" },
] as const;

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

// ============================================================================
// Composant principal
// ============================================================================

export function EcmSignupForm({ defaultProgramSlug }: { defaultProgramSlug: string }) {
  const router = useRouter();
  const t = useT();
  const preselectedProgramme = SLUG_TO_SPORT_LABEL[defaultProgramSlug] ?? "";

  const [phase, setPhase] = useState<"landing" | "form">("landing");
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [mainStep, setMainStep] = useState<1 | 2 | 3>(1);
  const [ecmSubStep, setEcmSubStep] = useState<1 | 2 | 3 | 4>(1);
  const [data, setData] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    profile: emptyEcmProfile(preselectedProgramme),
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
  const [objError, setObjError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const profile = data.profile;
  const setProfile = (patch: Partial<EcmProfileCookie>) =>
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));

  const titles = [t("su.form.title1"), t("su.form.title2"), t("su.form.title3")];
  const subs = [
    <>
      {t("su.form.alreadyMember")} <a href="#">{t("su.form.signIn")}</a>
    </>,
    t("su.form.sub2"),
    t("su.form.sub3"),
  ];
  const ecmLabels = [t("su.form.sub.personal"), t("su.form.sub.sport"), t("su.form.sub.nutrition"), t("su.form.sub.health")];

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

  function toggleMulti(key: "rest" | "comp", value: string) {
    const arr = profile[key];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setProfile({ [key]: next } as Partial<EcmProfileCookie>);
  }

  function onObjectifExceed() {
    setObjError(true);
    setTimeout(() => setObjError(false), 1500);
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
    const matchedSlug = SPORT_LABEL_TO_SLUG[profile.programmePrincipal] ?? defaultProgramSlug;
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
    const firstName = result.firstName || data.firstName || dv(t, "Athlète");
    router.push(`/welcome?firstName=${encodeURIComponent(firstName)}&programme=${encodeURIComponent(matchedSlug)}`);
  }

  if (phase === "landing") {
    return (
      <div className={cx(styles.ecmRoot, styles.landing)}>
        <div className={styles.landingBadge}>{t("su.form.badge")}</div>

        <div className={cx(styles.accordion, accordionOpen && styles.open)}>
          <button className={styles.accordionToggle} type="button" onClick={() => setAccordionOpen((v) => !v)}>
            {t("su.form.learnMore")}
            <span className={styles.accordionIcon}>▾</span>
          </button>
          <div className={styles.accordionContent}>
            {LANDING_STEPS.map((s) => (
              <div key={s.n} className={styles.stepItem}>
                <div className={styles.stepNum}>{s.n}</div>
                <div>
                  <div className={styles.stepName}>{t(s.name)}</div>
                  <div className={styles.stepDesc}>{t(s.desc)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className={styles.btnLetsgo} type="button" onClick={() => setPhase("form")}>
          LET&apos;S GO ⚡
        </button>

        <p className={styles.landingSecure}>
          {t("su.form.secure")}
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
            <span>{t("su.form.stepOf", { n: mainStep })}</span>
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
          {clerkEnabledClient ? (
            <AccountStepClerk
              data={data}
              setData={setData}
              firstNameError={firstNameError}
              setFirstNameError={setFirstNameError}
              emailError={emailError}
              setEmailError={setEmailError}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              strength={strength}
              onNext={() => setMainStep(2)}
            />
          ) : (
            <AccountStepDemo
              data={data}
              setData={setData}
              firstNameError={firstNameError}
              emailError={emailError}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              strength={strength}
              onContinue={goToStep1to2}
            />
          )}
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
                <i>👤</i> {t("su.form.nameBirth")}
              </div>
              <div className={styles.nr} style={{ gap: 8, marginBottom: 8 }}>
                <input
                  className={styles.ecmInput}
                  type="text"
                  placeholder={t("su.form.namePh")}
                  style={{ flex: 2 }}
                  value={profile.prenom}
                  onChange={(e) => setProfile({ prenom: e.target.value })}
                />
                <input
                  className={styles.ecmInput}
                  type="date"
                  style={{ flex: 2 }}
                  max={new Date().toISOString().slice(0, 10)}
                  value={profile.dateNaissance}
                  onChange={(e) => setProfile({ dateNaissance: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>📏</i> {t("su.form.morpho")}
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
            <ObjectifsPicker
              values={profile.objectifs}
              onChange={(next) => setProfile({ objectifs: next })}
              onExceed={onObjectifExceed}
              programme={profile.programmePrincipal}
              onProgramme={(v) => setProfile({ programmePrincipal: v })}
              onPickOtherProgramme={() => ecmGo(1)}
            />
            {objError && (
              <div style={{ marginTop: 6, fontSize: "0.8rem", color: "var(--error)" }}>{t("su.form.maxGoals")}</div>
            )}
            <button className={styles.btnSubNext} type="button" onClick={() => ecmGo(1)}>
              {t("su.form.nextSport")}
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => setMainStep(1)}>
              {t("su.form.backAccount")}
            </button>
          </div>

          {/* Sous-étape 2 — Profil sportif */}
          <div className={cx(styles.ecmStep, ecmSubStep === 2 && styles.active)}>
            <ProgrammePrincipalPicker
              value={profile.programmePrincipal}
              onChange={(v) => setProfile({ programmePrincipal: v })}
            />
            <WeekCyclePicker
              value={profile.weekCycle}
              programmeLabel={profile.programmePrincipal}
              onChange={(v) => setProfile({ weekCycle: v })}
            />

            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>🏗️</i> {t("su.form.equip")}
              </div>
              <MoSolo options={EQUIPEMENTS} value={profile.equip} onChange={(v) => setProfile({ equip: v })} />
            </div>

            <button className={styles.btnSubNext} type="button" onClick={() => ecmGo(2)}>
              {t("su.form.nextNutrition")}
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => ecmBack(2)}>
              {t("su.back")}
            </button>
          </div>

          {/* Sous-étape 3 — Nutrition */}
          <div className={cx(styles.ecmStep, ecmSubStep === 3 && styles.active)}>
            <div className={styles.qc}>
              <div className={styles.ql}>
                <i>⏱️</i> {t("su.form.fasting")}
              </div>
              <YesNo value={profile.jeune} onChange={(v) => setProfile({ jeune: v })} />
              {profile.jeune && (
                <div style={{ marginTop: 10 }}>
                  <div className={styles.dl}>{t("su.form.fastType")}</div>
                  <div className={styles.opts} style={{ marginBottom: 10 }}>
                    {["16:8", "18:6", "20:4", "Autre"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        className={cx(styles.opt, profile.tj === o && styles.sel)}
                        onClick={() => setProfile({ tj: o })}
                      >
                        {dv(t, o)}
                      </button>
                    ))}
                  </div>
                  <div className={styles.dl}>{t("su.form.eatWindow")}</div>
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
                🚫 {t("su.form.restrictions")} <span className={styles.hint}>{t("su.form.multi")}</span>
              </div>
              <MoMulti options={RESTRICTIONS} values={profile.rest} onToggle={(v) => toggleMulti("rest", v)} />
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>💧 {t("su.form.hydration")}</div>
              <div className={styles.opts}>
                {["Moins de 1.5L", "1.5 - 2L", "2 - 3L", "Plus de 3L"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={cx(styles.opt, profile.hydra === o && styles.sel)}
                    onClick={() => setProfile({ hydra: o })}
                  >
                    {dv(t, o)}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.btnSubNext} type="button" onClick={() => ecmGo(3)}>
              {t("su.form.nextHealth")}
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => ecmBack(3)}>
              {t("su.back")}
            </button>
          </div>

          {/* Sous-étape 4 — Santé & Compléments */}
          <div className={cx(styles.ecmStep, ecmSubStep === 4 && styles.active)}>
            <div className={styles.qc}>
              <div className={styles.ql}>🤕 {t("su.form.injuries")}</div>
              <YesNo value={profile.bles} onChange={(v) => setProfile({ bles: v })} />
              {profile.bles && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className={styles.ecmTa}
                    placeholder={t("su.form.injuriesPh")}
                    value={profile.bt}
                    onChange={(e) => setProfile({ bt: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>
                💊 {t("su.form.supplements")} <span className={styles.hint}>{t("su.form.multi")}</span>
              </div>
              <MoMulti options={COMPLEMENTS} values={profile.comp} onToggle={(v) => toggleMulti("comp", v)} />
              <div style={{ marginTop: 8 }}>
                <div className={styles.dl}>{t("su.form.others")}</div>
                <input
                  className={styles.ecmInput}
                  type="text"
                  placeholder={t("su.form.othersPh")}
                  value={profile.ca}
                  onChange={(e) => setProfile({ ca: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>😴 {t("su.form.sleepQuality")}</div>
              <div className={styles.opts}>
                {["😴 Très bonne", "🌤 Correcte", "😓 Difficile", "😫 Très mauvaise"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={cx(styles.opt, profile.qs === o && styles.sel)}
                    onClick={() => setProfile({ qs: o })}
                  >
                    {dv(t, o)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.qc}>
              <div className={styles.ql}>⏰ {t("su.form.sleepDuration")}</div>
              <div className={styles.opts}>
                {["Moins de 6h", "6h - 7h", "7h - 8h", "Plus de 8h"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={cx(styles.opt, profile.ds === o && styles.sel)}
                    onClick={() => setProfile({ ds: o })}
                  >
                    {dv(t, o)}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.btnNext} type="button" style={{ marginTop: 16 }} onClick={() => setMainStep(3)}>
              {t("su.form.toPayment")} <span className={styles.arrow}>→</span>
            </button>
            <button className={styles.btnSubBack} type="button" onClick={() => ecmBack(4)}>
              {t("su.back")}
            </button>
          </div>
        </div>

        {/* ══ STEP 3 — PAIEMENT ══ */}
        <div className={cx(styles.stepWrap, mainStep === 3 && styles.active)}>
          <div className={styles.trialReminder}>
            <div className={styles.trialReminderIcon}>⚡</div>
            <div className={styles.trialReminderText}>
              <strong>{t("su.form.trialTitle")}</strong>
              <br />
              {t("su.form.trialDesc")}
            </div>
          </div>

          <div className={styles.cardSection}>
            <span className={styles.cardLabel}>{t("su.form.payInfo")}</span>
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
                  <span className={styles.cardMiniLabel}>{t("su.form.cardholder")}</span>
                  <input
                    className={styles.cardMiniInput}
                    type="text"
                    placeholder={t("su.form.cardholderPh")}
                    value={data.cardholder}
                    onChange={(e) => setData((d) => ({ ...d, cardholder: e.target.value }))}
                  />
                </div>
                <div className={styles.cardMiniField}>
                  <span className={styles.cardMiniLabel}>{t("su.form.expiry")}</span>
                  <input
                    className={styles.cardMiniInput}
                    type="text"
                    placeholder={t("su.form.expiryPh")}
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
            <div className={styles.secureNote}>{t("su.form.ssl")}</div>
          </div>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={data.cgv}
              onChange={(e) => setData((d) => ({ ...d, cgv: e.target.checked }))}
            />
            <div className={styles.checkBox} style={cgvError ? { borderColor: "var(--error)" } : undefined} />
            <span className={styles.checkText}>
              {t("su.form.accept")} <a href="#">{t("su.form.terms")}</a> {t("su.form.and")} <a href="#">{t("su.form.privacy")}</a>.
            </span>
          </label>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={data.remind}
              onChange={(e) => setData((d) => ({ ...d, remind: e.target.checked }))}
            />
            <div className={styles.checkBox} />
            <span className={styles.checkText}>{t("su.form.remind")}</span>
          </label>

          <button className={styles.btnNext} type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting ? t("su.form.creating") : t("su.form.start")} <span className={styles.arrow}>→</span>
          </button>
          <button className={styles.btnBack} type="button" onClick={() => setMainStep(2)}>
            {t("su.form.backProfile")}
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
  const t = useT();
  return (
    <div className={styles.left}>
      <div className={styles.logo}>
        EL <span>COACH</span>
      </div>

      <div className={styles.leftHero}>
        <div className={styles.leftBadge}>{t("su.form.badge")}</div>
        <h1 className={styles.leftTitle}>
          {t("su.form.left.start")}
          <span className={styles.accentLine}>{t("su.form.left.now")}</span>
        </h1>
        <p className={styles.leftSub}>
          {t("su.form.left.sub")} <strong>{t("su.form.left.right")}</strong>
          <br />
          {t("su.form.left.noCharge")}
        </p>

        <div className={styles.programsList}>
          {LEFT_PROGRAMS.map((p) => (
            <div key={p.name} className={styles.progItem}>
              <div className={styles.progDot} />
              <span className={styles.progItemName}>{p.name}</span>
              <span className={styles.progItemTag}>{dv(t, p.tag)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.trialBanner}>
        <div className={styles.trialIcon}>⚡</div>
        <div>
          <div className={styles.trialTitle}>FREE TRIAL</div>
          <div className={styles.trialDesc}>
            {t("su.form.left.banner1")}
            <br />
            {t("su.form.left.banner2")}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountFields({
  data,
  setData,
  firstNameError,
  emailError,
  showPassword,
  setShowPassword,
  strength,
  passwordPlaceholder,
  passwordError,
}: {
  data: FormState;
  setData: Dispatch<SetStateAction<FormState>>;
  firstNameError: boolean;
  emailError: boolean;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  strength: "weak" | "medium" | "strong" | null;
  passwordPlaceholder?: string;
  passwordError?: string | null;
}) {
  const t = useT();
  return (
    <>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label>{t("su.form.firstName")}</label>
          <input
            type="text"
            placeholder={t("su.form.firstName")}
            value={data.firstName}
            onChange={(e) => setData((d) => ({ ...d, firstName: e.target.value }))}
            className={firstNameError ? styles.fieldError : undefined}
          />
          {firstNameError && <span className={cx(styles.fieldHint, styles.errorMsg, styles.show)}>{t("su.form.required")}</span>}
        </div>
        <div className={styles.field}>
          <label>{t("su.form.lastName")}</label>
          <input
            type="text"
            placeholder={t("su.form.lastName")}
            value={data.lastName}
            onChange={(e) => setData((d) => ({ ...d, lastName: e.target.value }))}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label>{t("su.email")}</label>
        <input
          type="email"
          placeholder={t("su.emailPh")}
          value={data.email}
          onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
          className={emailError ? styles.fieldError : undefined}
        />
        {emailError && <span className={cx(styles.fieldHint, styles.errorMsg, styles.show)}>{t("su.emailInvalid")}</span>}
      </div>
      <div className={styles.field}>
        <label>{t("su.form.password")}</label>
        <div className={styles.fieldPw}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={passwordPlaceholder ?? t("su.pwPlaceholder")}
            value={data.password}
            onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
          />
          <button className={styles.pwToggle} type="button" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? t("su.pwHide") : t("su.pwShow")}
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
        {passwordError && <span className={cx(styles.fieldHint, styles.errorMsg, styles.show)}>{passwordError}</span>}
      </div>
    </>
  );
}

function AccountStepDemo({
  data,
  setData,
  firstNameError,
  emailError,
  showPassword,
  setShowPassword,
  strength,
  onContinue,
}: {
  data: FormState;
  setData: Dispatch<SetStateAction<FormState>>;
  firstNameError: boolean;
  emailError: boolean;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  strength: "weak" | "medium" | "strong" | null;
  onContinue: () => void;
}) {
  const t = useT();
  return (
    <>
      <AccountFields
        data={data}
        setData={setData}
        firstNameError={firstNameError}
        emailError={emailError}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        strength={strength}
      />
      <button className={styles.btnNext} type="button" onClick={onContinue}>
        {t("su.form.continue")} <span className={styles.arrow}>→</span>
      </button>
    </>
  );
}

/**
 * Crée un vrai compte Clerk (persistant, multi-appareil) au lieu du cookie
 * démo. Vérification email par code — c'est le comportement par défaut d'une
 * app Clerk ; on ne désactive pas cette protection.
 */
function AccountStepClerk({
  data,
  setData,
  firstNameError,
  setFirstNameError,
  emailError,
  setEmailError,
  showPassword,
  setShowPassword,
  strength,
  onNext,
}: {
  data: FormState;
  setData: Dispatch<SetStateAction<FormState>>;
  firstNameError: boolean;
  setFirstNameError: Dispatch<SetStateAction<boolean>>;
  emailError: boolean;
  setEmailError: Dispatch<SetStateAction<boolean>>;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  strength: "weak" | "medium" | "strong" | null;
  onNext: () => void;
}) {
  const { signUp } = useSignUp();
  const router = useRouter();
  const t = useT();
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * En dev (pas de domaine custom), la session Clerk n'est vraiment
   * synchronisée côté serveur qu'après avoir traversé l'URL décorée par
   * `decorateUrl` (poignée de main "dev browser") — sans ça, `auth()` côté
   * serveur reste signed-out même si le SDK client se croit connecté.
   * On revient ensuite sur /signup (même route, mainStep passe à 2 via onNext).
   */
  async function finalizeSession() {
    await signUp.finalize({
      navigate: async ({ decorateUrl }) => {
        const url = decorateUrl("/signup");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else if (url !== "/signup") {
          router.push(url);
        }
        onNext();
      },
    });
  }

  async function handleContinue() {
    const okFirst = data.firstName.trim().length > 0;
    const okEmail = data.email.includes("@");
    const pwError = validatePassword(data.password, t);
    setFirstNameError(!okFirst);
    setEmailError(!okEmail);
    setPasswordError(pwError);
    if (!okFirst || !okEmail || pwError) return;

    setBusy(true);
    setError(null);
    try {
      // Le prénom/nom sont collectés dans le profil ECM (étape suivante, en
      // base Postgres) — cette instance Clerk ne collecte pas ces champs.
      const { error: signUpError } = await signUp.password({
        emailAddress: data.email,
        password: data.password,
      });
      if (signUpError) {
        setError(signUpError.message ?? t("su.form.createFail"));
        return;
      }
      if (signUp.status === "complete") {
        await finalizeSession();
        return;
      }
      if (signUp.unverifiedFields?.includes("email_address")) {
        await signUp.verifications.sendEmailCode();
        setVerifying(true);
        return;
      }
      setError(t("su.form.emailUsed"));
    } catch (err) {
      console.error("AccountStepClerk.handleContinue:", err);
      setError(t("su.techError"));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setError(verifyError.message ?? t("su.reset.codeInvalid"));
        return;
      }
      if (signUp.status === "complete") {
        await finalizeSession();
      }
    } catch (err) {
      console.error("AccountStepClerk.handleVerify:", err);
      setError(t("su.techError"));
    } finally {
      setBusy(false);
    }
  }

  if (verifying) {
    return (
      <>
        <p className={styles.formSubtitle} style={{ marginBottom: 16 }}>
          {t("su.codeSentTo")} <strong>{data.email}</strong>.
        </p>
        <div className={styles.field}>
          <label>{t("su.form.verifyLabel")}</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
        {error && (
          <div className="mb-4 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        <button className={styles.btnNext} type="button" disabled={busy || code.length < 6} onClick={handleVerify}>
          {busy ? t("su.form.verifying") : t("su.form.verify")} <span className={styles.arrow}>→</span>
        </button>
        <button
          className={styles.pwToggle}
          type="button"
          onClick={() => signUp.verifications.sendEmailCode()}
          style={{ marginTop: 12 }}
        >
          {t("su.form.resend")}
        </button>
      </>
    );
  }

  return (
    <>
      <AccountFields
        data={data}
        setData={setData}
        firstNameError={firstNameError}
        emailError={emailError}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        strength={strength}
        passwordError={passwordError}
      />
      {error && (
        <div className="mb-4 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      <button className={styles.btnNext} type="button" disabled={busy} onClick={handleContinue}>
        {busy ? t("su.form.creatingShort") : t("su.form.continue")} <span className={styles.arrow}>→</span>
      </button>
      <div id="clerk-captcha" />
    </>
  );
}
