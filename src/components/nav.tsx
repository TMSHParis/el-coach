import Link from "next/link";
import { clerkEnabled } from "@/lib/clerk";
import { auth, currentUser } from "@clerk/nextjs/server";
import { MobileDrawer } from "./mobile-drawer";
import { ProfileIcon } from "./profile-icon";

export async function Nav() {
  let userId: string | null = null;
  if (clerkEnabled) {
    const session = await auth();
    userId = session.userId;
  }
  const signedIn = Boolean(userId);
  const user = clerkEnabled && signedIn ? await currentUser() : null;

  return (
    <header className="hairline-b sticky top-0 z-50 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          {clerkEnabled && <MobileDrawer signedIn={signedIn} />}
          <Link href="/" className="mono text-xs font-semibold tracking-[0.2em] text-white md:text-sm md:tracking-[0.25em]">
            EL COACH <span className="text-[color:var(--color-gold)]">METHOD</span>
          </Link>
        </div>
        <nav className="label hidden items-center gap-8 md:flex">
          <Link href="/marketplace" className="hover:text-white">Programmes</Link>
          <Link href="/training" className="hover:text-white">Training</Link>
          <Link href="/wods" className="hover:text-white">WODs</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </nav>
        {clerkEnabled && (
          <Link
            href={signedIn ? "/dashboard" : "/signin"}
            className="btn-ghost !px-3 !py-2 !text-[10px] !tracking-[0.12em] md:!px-5 md:!py-3 md:!text-xs"
          >
            {signedIn ? "Mon Dashboard" : "Déjà inscrit · Connexion"}
          </Link>
        )}
        {clerkEnabled && (
          <ProfileIcon signedIn={signedIn} imageUrl={user?.imageUrl ?? null} initial={user?.firstName?.[0] ?? "•"} />
        )}
      </div>
    </header>
  );
}
