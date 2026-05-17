import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
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

export const metadata = { title: "Inscription Free Trial — 7 jours offerts · EL COACH METHOD" };

const DAILY_LOOP_STEPS = [
  {
    n: "01",
    t: "Profil & programme",
    b: "Âge, poids, RM, blessures, jeûne, compléments. Le Coaching Adaptatif apprend qui tu es et choisit le programme adapté.",
  },
  {
    n: "02",
    t: "Check-in matinal · 2 min",
    b: "Énergie, sommeil Apple Watch, jambes, douleurs, mental, libido. Le Coaching Adaptatif lit ton état réel.",
  },
  {
    n: "03",
    t: "Plan du jour · < 5 sec",
    b: "Score 🟢🟡🔴, séance adaptée, stack compléments, en-cas, protocole récup, alertes, aperçu demain.",
  },
  {
    n: "04",
    t: "Exécute · ajuste demain",
    b: "Tu suis le plan. Le Coaching Adaptatif apprend de chaque journée et calibre les semaines suivantes.",
  },
];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; program?: string; error?: string }>;
}) {
  const { step: stepParam, program: programParam, error } = await searchParams;
  const state = await getSignupState();
  const preselectedProgram = programParam ?? state?.programSlug ?? "";

  // Mode intro : pas de param `step` ET pas encore de compte → on affiche
  // l'écran d'accueil avec collapsible + bouton LET'S GO.
  if (!stepParam && !state) {
    return <IntroScreen />;
  }

  const step = clampStep(stepParam, state);

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/signup"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        ← Retour à l&apos;intro
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Inscription Free Trial — 7 jours offerts
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-mute)]">
          Ton Coaching Adaptatif à {formatPrice(PROGRAM_BASE_PRICE_CENTS)} / mois. Aucun
          débit avant J+7. Annulation en un clic.
        </p>
      </header>

      {error === "invalid" && (
        <div className="mt-6 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Vérifie tes informations et réessaie.
        </div>
      )}

      <div className="mt-10">
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

// ============================================================================
// Écran d'accueil intro — titre, sous-titre, collapsible, LET'S GO doré
// ============================================================================

function IntroScreen() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="label inline-flex items-center gap-2 text-[color:var(--color-mute)] hover:text-white"
      >
        ← Accueil
      </Link>

      <header className="mt-10 text-center">
        <div className="mono inline-flex items-center gap-2 border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
          ✦ FREE TRIAL — 7 JOURS OFFERTS
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
          Inscription Free Trial
          <br />
          <span className="text-[color:var(--color-mute)]">— 7 jours offerts</span>
        </h1>
        <p className="mt-5 text-base text-[color:var(--color-mute)] md:text-lg">
          Ton Coaching Adaptatif à{" "}
          <strong className="text-white">{formatPrice(PROGRAM_BASE_PRICE_CENTS)} / mois</strong>.
          <br />
          Aucun débit avant J+7. Annulation en un clic.
        </p>
      </header>

      <details className="card group mt-10 overflow-hidden">
        <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-left md:p-6 [&::-webkit-details-marker]:hidden">
          <span className="text-base font-semibold">Cliquer pour en savoir plus</span>
          <span
            aria-hidden
            className="mono text-xs tracking-[0.2em] text-[color:var(--color-mute)] transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <div className="border-t border-[color:var(--color-line)] p-5 md:p-6">
          <div className="label text-[color:var(--color-accent)]">[ LA BOUCLE QUOTIDIENNE ]</div>
          <p className="mt-3 text-sm text-[color:var(--color-mute)]">
            Chaque matin, en moins de 5 minutes, ton plan de journée complet.
          </p>
          <ol className="mt-6 grid gap-4">
            {DAILY_LOOP_STEPS.map((s) => (
              <li
                key={s.n}
                className="grid gap-2 border-l-2 border-[color:var(--color-line)] pl-5"
              >
                <div className="mono text-3xl font-semibold leading-none">{s.n}</div>
                <div className="text-base font-semibold">{s.t}</div>
                <p className="text-sm text-[color:var(--color-mute)]">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </details>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/signup?step=1"
          className="mono inline-flex items-center justify-center gap-3 bg-[color:var(--color-accent)] px-12 py-5 text-base font-semibold tracking-[0.3em] text-black shadow-[0_0_40px_rgba(232,255,0,0.35)] transition-all hover:bg-[color:var(--color-accent-soft)] hover:shadow-[0_0_60px_rgba(232,255,0,0.55)]"
        >
          LET&apos;S GO <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
        <div className="mono text-[10px] tracking-[0.25em] text-[color:var(--color-mute)]">
          Sans engagement · Annulation en un clic
        </div>
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

      <button type="submit" className="btn-primary mt-2 justify-center">
        Continuer →
      </button>
    </form>
  );
}

// ============================================================================
// Étape 2 — choix de la programmation (simplifié — sans summary)
// ============================================================================

function ProgramStep({ currentSlug }: { currentSlug?: string }) {
  return (
    <form action={submitProgramStep} className="space-y-3">
      <p className="text-sm text-[color:var(--color-mute)]">
        Tu peux changer de programme à tout moment depuis ton profil.
      </p>
      <div className="grid gap-2">
        {programTemplates.map((t) => {
          const checked = t.slug === currentSlug;
          return (
            <label
              key={t.slug}
              className={`flex cursor-pointer items-center gap-4 border p-4 transition-colors ${
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
                <ProgramIcon template={t} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold">{t.name}</div>
                <div className="mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-mute)]">
                  {t.level}
                </div>
              </div>
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
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
