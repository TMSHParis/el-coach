import { coaches } from "@/lib/data";
import { CoachCard } from "@/components/coach-card";

export const metadata = { title: "Coachs — EL COACH METHOD" };

export default function CoachesPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ COACHS ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        L&apos;équipe complète
      </h1>
      <p className="mt-4 max-w-xl text-[color:var(--color-mute)]">
        Athlètes confirmés, kinés, programmeurs périodiques. Sélectionnés, pas recrutés.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coaches.map((c) => (
          <CoachCard key={c.slug} coach={c} />
        ))}
      </div>
    </section>
  );
}
