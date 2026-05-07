import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { getSignupState } from "../actions";

export const metadata = { title: "Bienvenue — EL COACH METHOD" };

export default async function SignupSuccessPage() {
  const state = await getSignupState();
  if (!state) redirect("/signup");

  const trialEndDate = state.trialEndsAt
    ? new Date(state.trialEndsAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <div className="text-white">
        <Logo size={56} />
      </div>

      <div className="mt-10 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
        <Check size={28} className="text-black" strokeWidth={3} />
      </div>

      <h1 className="gold-shimmer mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
        Bienvenue, {state.firstName}.
      </h1>

      <p className="mt-6 max-w-sm text-base text-[color:var(--color-mute)]">
        Ton compte EL COACH METHOD est créé.
        {trialEndDate && (
          <>
            <br />
            Ton essai gratuit court jusqu&apos;au <strong className="text-white">{trialEndDate}</strong>.
          </>
        )}
      </p>

      <Link href="/signup/profile" className="btn-primary mt-10 inline-flex">
        Compléter mon profil →
      </Link>
      <Link
        href="/dashboard"
        className="label mt-4 text-[color:var(--color-mute)] hover:text-white"
      >
        Plus tard, accéder à mon dashboard
      </Link>
    </section>
  );
}
