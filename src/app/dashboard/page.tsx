import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Activity, Flame, Target, TrendingUp } from "lucide-react";
import { getProgram, programs as allPrograms } from "@/lib/data";
import { clerkEnabled } from "@/lib/clerk";
import { ProgramCard } from "@/components/program-card";

export const metadata = { title: "Dashboard — EL COACH" };

export default async function DashboardPage() {
  if (!clerkEnabled) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="label">[ DASHBOARD / DEMO ]</div>
        <h1 className="mt-4 text-4xl font-semibold">Mode démo</h1>
        <p className="mt-4 text-[color:var(--color-mute)]">
          Clerk n&apos;est pas configuré. Ajoute <span className="mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span>{" "}
          et <span className="mono">CLERK_SECRET_KEY</span> pour activer l&apos;authentification.
        </p>
        <Link href="/marketplace" className="btn-primary mt-8 inline-flex">
          Explorer la marketplace
        </Link>
      </section>
    );
  }

  const session = await auth();
  if (!session.userId) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Connexion requise</h1>
        <Link href="/sign-in" className="btn-primary mt-8 inline-flex">
          Se connecter
        </Link>
      </section>
    );
  }

  const user = await currentUser();
  const ownedSlugs = (user?.publicMetadata?.programs as string[] | undefined) ?? [];
  const owned = ownedSlugs.map(getProgram).filter(Boolean) as ReturnType<typeof getProgram>[];
  const display = owned.length > 0 ? owned : allPrograms.slice(0, 2);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="label">[ DASHBOARD ]</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
        Salut {user?.firstName ?? "Athlète"}.
      </h1>
      <p className="mt-3 text-[color:var(--color-mute)]">
        {owned.length > 0
          ? `${owned.length} programme(s) actif(s). Séance du jour chargée.`
          : "Aucun programme actif. Voici deux suggestions pour démarrer."}
      </p>

      <div className="mt-10 grid gap-px bg-[color:var(--color-line)] md:grid-cols-4">
        <KPI icon={<Flame size={16} />} label="STREAK" value="14j" />
        <KPI icon={<Activity size={16} />} label="SÉANCES" value="42" />
        <KPI icon={<Target size={16} />} label="PR CE MOIS" value="3" />
        <KPI icon={<TrendingUp size={16} />} label="VOLUME" value="128T" />
      </div>

      <div className="mt-16">
        <div className="label">[ PROGRAMMES ]</div>
        <h2 className="mt-3 text-2xl font-semibold md:text-3xl">
          {owned.length > 0 ? "Tes programmes" : "Suggestions"}
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {display.map((p) => p && <ProgramCard key={p.slug} program={p} />)}
        </div>
      </div>

      <div className="mt-16 card grain p-8">
        <div className="label">[ SÉANCE DU JOUR ]</div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h3 className="text-2xl font-semibold">Upper Heavy · Semaine 3 / J2</h3>
            <p className="mt-2 text-sm text-[color:var(--color-mute)]">
              Bench 5×3 @ 82.5% · Rows 4×8 · DB Press 3×10 · Face pulls 3×15
            </p>
          </div>
          <button className="btn-primary">Démarrer</button>
        </div>
      </div>
    </section>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[color:var(--color-ash)] p-6">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon}
      </div>
      <div className="mono mt-4 text-3xl font-semibold">{value}</div>
    </div>
  );
}
