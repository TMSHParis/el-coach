import { ArrowRight } from "lucide-react";
import { ProgramIcon } from "@/components/program-icon";
import { programTemplates } from "@/lib/programming";
import { selectProgram } from "../dashboard/actions";

export const metadata = { title: "Free Trial — EL COACH METHOD" };

export default function OnboardingPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="gold-shimmer text-4xl font-semibold tracking-tight md:text-6xl">
        Free Trial — 7 jours offerts.
      </h1>
      <p className="mt-6 max-w-xl text-base text-[color:var(--color-mute)] md:text-lg">
        Ta programmation, ton dashboard, ta séance du jour — tout de suite.
        <br />
        Aucun débit avant la fin de ton essai.
      </p>

      <div className="mt-12 grid gap-px bg-[color:var(--color-line)] md:grid-cols-2">
        {programTemplates.map((t) => (
          <form key={t.slug} action={selectProgram}>
            <input type="hidden" name="slug" value={t.slug} />
            <button
              type="submit"
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
                {t.daysPerWeek}j/sem · niveau {t.level}
              </div>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
