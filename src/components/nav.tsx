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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {clerkEnabled && <MobileDrawer signedIn={signedIn} />}
          <Link href="/" className="mono text-sm font-semibold tracking-[0.25em] text-white">
            EL COACH <span className="text-[color:var(--color-gold)]">METHOD</span>
          </Link>
        </div>
        <nav className="label hidden items-center gap-8 md:flex">
          <Link href="/marketplace" className="hover:text-white">Programmes</Link>
          <Link href="/training" className="hover:text-white">Training</Link>
          <Link href="/wods" className="hover:text-white">WODs</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          {clerkEnabled && !signedIn && (
            <Link href="/signin" className="btn-ghost">Connexion</Link>
          )}
          {clerkEnabled && signedIn && (
            <Link href="/dashboard" className="btn-ghost">Mon Dashboard</Link>
          )}
          {clerkEnabled && (
            <ProfileIcon signedIn={signedIn} imageUrl={user?.imageUrl ?? null} initial={user?.firstName?.[0] ?? "•"} />
          )}
        </div>
      </div>
    </header>
  );
}
