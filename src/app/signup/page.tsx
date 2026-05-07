import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { ProgramIcon } from "@/components/program-icon";
import { programTemplates } from "@/lib/programming";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import {
  getSignupState,
  submitAccountStep,
  submitProgramStep,
  submitPaymentStep,
} from "./actions";
import { PasswordField } from "./password-field";
import { CardField } from "./card-field";

export const metadata = { title: "Inscription — EL COACH METHOD" };

const STEP_LABELS = ["Compte", "Programme", "Carte"];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; program?: string; error?: string }>;
}) {
  const { step: stepParam, program: programParam, error } = await searchParams;
  const state = await getSignupState();
  const step = clampStep(stepParam, state);
  const preselectedProgram = programParam ?? state?.programSlug ?? "";

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/onboarding"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        ← Retour à l&apos;essai gratuit
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Crée ton compte EL COACH METHOD
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-mute)]">
          Free Trial — 7 jours offerts. Aucun débit avant J+7. Annulation en un clic.
        </p>
      </header>

      <Stepper step={step} />

      {error === "invalid" && (
        <div className="mt-6 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Vérifie tes informations et réessaie.
        </div>
      )}

      <div className="mt-8">
        {step === 1 && (
          <AccountStep
            preselectedProgram={preselectedProgram}
            initial={state ?? undefined}
          />
        )}
        {step === 2 && <ProgramStep currentSlug={state?.programSlug} />}
        {step === 3 && <PaymentStep />}
      </div>
    </section>
  );
}

function clampStep(stepParam: string | undefined, state: Awaited<ReturnType<typeof getSignupState>>): 1 | 2 | 3 {
  const raw = Number(stepParam) || 1;
  // On force step 1 si pas encore de compte créé.
  if (!state) return 1;
  if (raw < 1) return 1;
  if (raw > 3) return 3;
  return raw as 1 | 2 | 3;
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mt-10 grid grid-cols-3 gap-2">
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
              ÉTAPE {n} · {label.toUpperCase()}
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
// Étape 1 — création de compte
// ============================================================================

function AccountStep({
  preselectedProgram,
  initial,
}: {
  preselectedProgram: string;
  initial?: Awaited<ReturnType<typeof getSignupState>>;
}) {
  return (
    <form action={submitAccountStep} className="card grid gap-5 p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Prénom"
          name="firstName"
          defaultValue={initial?.firstName ?? ""}
          required
          autoComplete="given-name"
        />
        <Field
          label="Nom"
          name="lastName"
          defaultValue={initial?.lastName ?? ""}
          required
          autoComplete="family-name"
        />
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initial?.email ?? ""}
        required
        autoComplete="email"
      />
      <PasswordField name="password" required minLength={6} />

      <input type="hidden" name="programSlug" value={preselectedProgram} />

      <div className="grid gap-3 border-t border-[color:var(--color-line)] pt-5 md:grid-cols-2">
        <button
          type="button"
          disabled
          className="btn-ghost cursor-not-allowed justify-center opacity-60"
          title="Bientôt disponible"
        >
          Continuer avec Google
        </button>
        <button
          type="button"
          disabled
          className="btn-ghost cursor-not-allowed justify-center opacity-60"
          title="Bientôt disponible"
        >
          Continuer avec Apple
        </button>
      </div>

      <button type="submit" className="btn-primary mt-2 justify-center">
        Continuer →
      </button>
    </form>
  );
}

// ============================================================================
// Étape 2 — choix de la programmation
// ============================================================================

function ProgramStep({ currentSlug }: { currentSlug?: string }) {
  return (
    <form action={submitProgramStep} className="space-y-3">
      <p className="text-sm text-[color:var(--color-mute)]">
        Tu peux changer de programme à tout moment depuis ton profil.
      </p>
      <div className="grid gap-3">
        {programTemplates.map((t) => {
          const checked = t.slug === currentSlug;
          const sessionsPerWeek =
            t.weeks[0]?.days.filter((d) => d.blocks.length > 0).length ?? 0;
          return (
            <label
              key={t.slug}
              className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${
                checked
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/5"
                  : "border-[color:var(--color-line)] bg-[color:var(--color-ash)] hover:bg-black"
              }`}
            >
              <input
                type="radio"
                name="programSlug"
                value={t.slug}
                defaultChecked={checked}
                required
                className="sr-only"
              />
              <div className="text-white">
                <ProgramIcon template={t} size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold">
                    {t.name} <span className="text-[color:var(--color-mute)] font-normal">· by El Coach Method</span>
                  </h3>
                  <span className="mono text-xs text-[color:var(--color-mute)]">
                    {sessionsPerWeek} j/sem · {t.level}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-[color:var(--color-mute)]">
                  {t.summary}
                </p>
              </div>
              <div
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  checked
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]"
                    : "border-[color:var(--color-line)]"
                }`}
              >
                {checked && <Check size={12} className="text-black" strokeWidth={3} />}
              </div>
            </label>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link href="/signup?step=1" className="label text-[color:var(--color-mute)] hover:text-white">
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
// Étape 3 — paiement
// ============================================================================

function PaymentStep() {
  return (
    <form action={submitPaymentStep} className="card grid gap-5 p-6 md:p-8">
      <div className="border-l-2 border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/5 p-4">
        <div className="label text-[color:var(--color-accent)]">FREE TRIAL — 7 JOURS OFFERTS</div>
        <p className="mt-2 text-sm">
          Carte enregistrée en garantie uniquement.
          <br />
          <strong>Aucun débit avant J+7. Annulation en un clic.</strong>
        </p>
      </div>

      <CardField />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Date d'expiration" name="expiry" placeholder="MM/AA" required pattern="\d{2}/\d{2}" />
        <Field label="CVV" name="cvv" placeholder="123" required pattern="\d{3,4}" maxLength={4} />
      </div>

      <Field label="Titulaire de la carte" name="cardholder" required autoComplete="cc-name" />

      <div className="grid gap-3 border-t border-[color:var(--color-line)] pt-4">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="cgv" required className="mt-0.5 accent-[color:var(--color-accent)]" />
          <span className="text-[color:var(--color-mute)]">
            J&apos;accepte les <a className="text-white underline" href="#">CGV</a> et la politique de confidentialité.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="reminder"
            defaultChecked
            className="mt-0.5 accent-[color:var(--color-accent)]"
          />
          <span className="text-[color:var(--color-mute)]">
            Me rappeler 24h avant la fin de mon essai.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link href="/signup?step=2" className="label text-[color:var(--color-mute)] hover:text-white">
          ← Retour
        </Link>
        <button type="submit" className="btn-primary justify-center">
          Démarrer mon essai gratuit →
        </button>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[color:var(--color-mute)]">
        <Lock size={12} />
        Paiement sécurisé · SSL 256-bit
      </div>
      <div className="mono text-center text-[10px] tracking-[0.2em] text-[color:var(--color-mute)]">
        Après l&apos;essai : {formatPrice(PROGRAM_BASE_PRICE_CENTS)}/mois · Sans engagement
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  autoComplete,
  placeholder,
  pattern,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  pattern?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        pattern={pattern}
        maxLength={maxLength}
        className="mt-1 w-full border border-[color:var(--color-line)] bg-transparent p-2.5 text-base placeholder:text-[color:var(--color-mute)] focus:border-[color:var(--color-accent)] focus:outline-none"
      />
    </label>
  );
}
