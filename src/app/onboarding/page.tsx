import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { programTemplates, type ProgramTemplate } from "@/lib/programming";
import { selectProgram } from "../dashboard/actions";

export const metadata = { title: "Choisis ton programme — EL COACH" };

const DISCIPLINE_LABEL: Record<ProgramTemplate["discipline"], string> = {
  crossfit: "CrossFit pure",
  hybrid: "Hybride · CF × Musculation",
  hyrox: "Hyrox pure",
  home: "À la maison",
};

export default function OnboardingPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="label">[ ONBOARDING · DÉMO ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        Choisis ta programmation.
      </h1>
      <p className="mt-4 max-w-xl text-[color:var(--color-mute)]">
        Mode démo sans compte. Sélectionne une programmation pour accéder à ton dashboard,
        ta semaine et ta séance du jour.{" "}
        <Link href="/training" className="underline hover:text-white">
          Voir les 4 en détail →
        </Link>
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
                <div>
                  <div className="label">[ {DISCIPLINE_LABEL[t.discipline]} ]</div>
                  <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{t.name}</h2>
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
