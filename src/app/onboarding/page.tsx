import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgramIcon } from "@/components/program-icon";
import { programTemplates } from "@/lib/programming";

export const metadata = { title: "Choisis ton programme — EL COACH METHOD" };

export default function OnboardingPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="mono inline-flex items-center gap-2 border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-[10px] tracking-[0.3em] text-[color:var(--color-accent)]">
        ✦ COACHING ADAPTATIF · PAR EL COACH METHOD
      </div>
      <h1 className="gold-shimmer mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
        Choisis ton programme.
      </h1>
      <p className="mt-6 max-w-xl text-base text-[color:var(--color-mute)] md:text-lg">
        Le Coaching Adaptatif piochera dedans chaque matin pour générer ta séance,
        adaptée à ton état du jour.
        <br />
        Tu peux en changer à tout moment depuis ton profil.
      </p>

      <div className="mt-12 grid gap-px bg-[color:var(--color-line)] md:grid-cols-2">
        {programTemplates.map((t) => (
          <Link
            key={t.slug}
            href={`/signup?program=${t.slug}`}
            className="group flex w-full flex-col gap-5 bg-[color:var(--color-ash)] p-8 text-left transition-colors hover:bg-black md:p-10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-white">
                  <ProgramIcon template={t} size={32} />
                </div>
                <h2 className="text-2xl font-semibold md:text-3xl">{t.name}</h2>
              </div>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              />
            </div>
            <p className="text-sm text-[color:var(--color-mute)]">{t.summary}</p>
            <div className="mono mt-auto text-xs uppercase text-[color:var(--color-mute)]">
              {t.daysPerWeek}j/sem · niveau {t.level} · by El Coach Method
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
