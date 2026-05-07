import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getTemplate } from "@/lib/programming";
import {
  getProfileState,
  getSignupState,
  submitProfileStep,
  submitLevelStep,
  submitRmStep,
  submitConfirmStep,
} from "../actions";

export const metadata = { title: "Profil athlète — EL COACH METHOD" };

const STEP_LABELS = ["Profil", "Niveau", "Records", "Confirmation"];

export default async function ProfileOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step: stepParam } = await searchParams;
  const signup = await getSignupState();
  if (!signup) redirect("/signup");

  const profile = await getProfileState();
  const step = clampStep(stepParam);

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/dashboard"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        <ArrowLeft size={14} /> Compléter plus tard
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          On finalise ton profil.
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-mute)]">
          Quelques infos rapides pour personnaliser ta programmation.
        </p>
      </header>

      <Stepper step={step} />

      <div className="mt-8">
        {step === 1 && <ProfileStep initial={profile} />}
        {step === 2 && <LevelStep initial={profile} />}
        {step === 3 && <RmStep programSlug={signup.programSlug} initial={profile?.rm} />}
        {step === 4 && <ConfirmStep firstName={signup.firstName} programSlug={signup.programSlug} />}
      </div>
    </section>
  );
}

function clampStep(stepParam: string | undefined): 1 | 2 | 3 | 4 {
  const raw = Number(stepParam) || 1;
  if (raw < 1) return 1;
  if (raw > 4) return 4;
  return raw as 1 | 2 | 3 | 4;
}

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mt-10 grid grid-cols-4 gap-2">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const isDone = step > n;
        const isActive = step === n;
        return (
          <div key={n} className="flex flex-col items-start gap-2">
            <div
              className={`mono text-[10px] tracking-[0.2em] ${
                isActive
                  ? "text-[color:var(--color-accent)]"
                  : isDone
                    ? "text-white"
                    : "text-[color:var(--color-mute)]"
              }`}
            >
              {n} · {label.toUpperCase()}
            </div>
            <div
              className={`h-1 w-full ${
                isDone || isActive
                  ? "bg-[color:var(--color-accent)]"
                  : "bg-[color:var(--color-line)]"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Étape 1 — Profil
// ============================================================================

function ProfileStep({
  initial,
}: {
  initial: Awaited<ReturnType<typeof getProfileState>>;
}) {
  return (
    <form action={submitProfileStep} className="card grid gap-5 p-6 md:p-8">
      <Field label="Date de naissance" name="birthDate" type="date" defaultValue={initial?.birthDate} required />

      <div>
        <span className="label">Sexe</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { value: "M", label: "Homme" },
            { value: "F", label: "Femme" },
            { value: "X", label: "Autre" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center justify-center border border-[color:var(--color-line)] bg-[color:var(--color-ash)] px-3 py-2 text-sm hover:border-[color:var(--color-accent)] has-[:checked]:border-[color:var(--color-accent)] has-[:checked]:bg-[color:var(--color-accent)]/5"
            >
              <input
                type="radio"
                name="gender"
                value={opt.value}
                defaultChecked={initial?.gender === opt.value}
                required
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Poids (kg)"
          name="weightKg"
          type="number"
          step="0.1"
          min="30"
          max="250"
          defaultValue={initial?.weightKg}
          required
        />
        <Field
          label="Taille (cm)"
          name="heightCm"
          type="number"
          min="120"
          max="230"
          defaultValue={initial?.heightCm}
          required
        />
      </div>

      <button type="submit" className="btn-primary mt-2 justify-center">
        Continuer →
      </button>
    </form>
  );
}

// ============================================================================
// Étape 2 — Niveau
// ============================================================================

const LEVELS: Array<{ value: NonNullable<Awaited<ReturnType<typeof getProfileState>>>["level"]; label: string; desc: string }> = [
  { value: "beginner", label: "Débutant", desc: "Je commence ou je reprends." },
  {
    value: "intermediate",
    label: "Intermédiaire",
    desc: "J'ai de l'expérience, je cherche à progresser.",
  },
  {
    value: "expert",
    label: "Expert",
    desc: "Je m'entraîne régulièrement depuis plusieurs années.",
  },
];

function LevelStep({
  initial,
}: {
  initial: Awaited<ReturnType<typeof getProfileState>>;
}) {
  return (
    <form action={submitLevelStep} className="space-y-3">
      <div className="grid gap-3">
        {LEVELS.map((opt) => {
          const checked = initial?.level === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${
                checked
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/5"
                  : "border-[color:var(--color-line)] bg-[color:var(--color-ash)] hover:bg-black"
              }`}
            >
              <input
                type="radio"
                name="level"
                value={opt.value}
                defaultChecked={checked}
                required
                className="sr-only"
              />
              <div
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  checked
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]"
                    : "border-[color:var(--color-line)]"
                }`}
              >
                {checked && <Check size={12} className="text-black" strokeWidth={3} />}
              </div>
              <div>
                <div className="text-lg font-semibold">{opt.label}</div>
                <div className="mt-1 text-sm text-[color:var(--color-mute)]">{opt.desc}</div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link href="/signup/profile?step=1" className="label text-[color:var(--color-mute)] hover:text-white">
          ← Retour
        </Link>
        <button type="submit" className="btn-primary justify-center">
          Continuer →
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Étape 3 — Records personnels
// ============================================================================

function getRmLifts(programSlug: string): Array<{ key: string; label: string; unit: string }> {
  const t = getTemplate(programSlug);
  if (!t) return [];
  if (t.discipline === "hypertrophy") {
    return [
      { key: "squat", label: "Squat", unit: "kg" },
      { key: "bench", label: "Bench Press", unit: "kg" },
      { key: "deadlift", label: "Deadlift", unit: "kg" },
      { key: "row", label: "Row", unit: "kg" },
    ];
  }
  if (t.discipline === "home") return [];
  // crossfit / hybrid / hyrox
  return [
    { key: "squat", label: "Back Squat", unit: "kg" },
    { key: "deadlift", label: "Deadlift", unit: "kg" },
    { key: "press", label: "Strict Press", unit: "kg" },
    { key: "snatch", label: "Snatch", unit: "kg" },
    { key: "cleanjerk", label: "Clean & Jerk", unit: "kg" },
  ];
}

function RmStep({
  programSlug,
  initial,
}: {
  programSlug: string;
  initial?: Record<string, number>;
}) {
  const lifts = getRmLifts(programSlug);

  if (lifts.length === 0) {
    return (
      <form action={submitRmStep} className="card p-6 md:p-8">
        <p className="text-sm text-[color:var(--color-mute)]">
          Programme bodyweight — aucun RM à renseigner. Tu peux passer cette étape.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/signup/profile?step=2" className="label text-[color:var(--color-mute)] hover:text-white">
            ← Retour
          </Link>
          <button type="submit" className="btn-primary justify-center">
            Passer →
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={submitRmStep} className="card grid gap-5 p-6 md:p-8">
      <p className="text-sm text-[color:var(--color-mute)]">
        Champs optionnels — tu peux passer et renseigner plus tard depuis ton profil.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {lifts.map((lift) => (
          <Field
            key={lift.key}
            label={`${lift.label} (${lift.unit})`}
            name={`rm.${lift.key}`}
            type="number"
            step="2.5"
            min="0"
            max="500"
            defaultValue={initial?.[lift.key]}
            placeholder="ex: 120"
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link href="/signup/profile?step=2" className="label text-[color:var(--color-mute)] hover:text-white">
          ← Retour
        </Link>
        <button type="submit" className="btn-primary justify-center">
          Continuer →
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Étape 4 — Confirmation
// ============================================================================

function ConfirmStep({
  firstName,
  programSlug,
}: {
  firstName: string;
  programSlug: string;
}) {
  const template = getTemplate(programSlug);
  return (
    <form action={submitConfirmStep} className="space-y-6">
      <div className="card p-6 md:p-8">
        <div className="label">RÉCAPITULATIF</div>
        <h2 className="mt-3 text-2xl font-semibold">
          {firstName}, ton profil est prêt.
        </h2>
        {template && (
          <p className="mono mt-3 text-sm text-[color:var(--color-mute)]">
            Programmation : <span className="text-white">{template.name} · by El Coach Method</span>
          </p>
        )}
        <p className="mt-6 text-sm text-[color:var(--color-mute)]">
          Tu peux modifier ces informations à tout moment depuis ton profil.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/signup/profile?step=3"
          className="label text-[color:var(--color-mute)] hover:text-white"
        >
          ← Retour
        </Link>
        <button type="submit" className="btn-primary justify-center">
          Accéder à mon programme →
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="mt-1 w-full border border-[color:var(--color-line)] bg-transparent p-2.5 text-base placeholder:text-[color:var(--color-mute)] focus:border-[color:var(--color-accent)] focus:outline-none"
      />
    </label>
  );
}
