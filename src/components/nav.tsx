import Link from "next/link";
import { clerkEnabled } from "@/lib/clerk";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export async function Nav() {
  let userId: string | null = null;
  if (clerkEnabled) {
    const session = await auth();
    userId = session.userId;
  }
  const signedIn = Boolean(userId);

  return (
    <header className="hairline-b sticky top-0 z-50 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="mono text-sm font-semibold tracking-[0.3em]">EL COACH</span>
        </Link>
        <nav className="label hidden items-center gap-8 md:flex">
          <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
          <Link href="/coaches" className="hover:text-white">Coachs</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/coach/apply" className="hover:text-white">Devenir coach</Link>
        </nav>
        <div className="flex items-center gap-3">
          {!clerkEnabled && (
            <Link href="/marketplace" className="btn-primary">Explorer</Link>
          )}
          {clerkEnabled && !signedIn && (
            <>
              <Link href="/sign-in" className="btn-ghost">Connexion</Link>
              <Link href="/sign-up" className="btn-primary">Commencer</Link>
            </>
          )}
          {clerkEnabled && signedIn && (
            <>
              <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: "h-9 w-9 rounded-none border border-white/20" },
                }}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" stroke="white" strokeWidth="1.5" />
      <path d="M6 6L18 18M18 6L6 18" stroke="white" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
