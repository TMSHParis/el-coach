import Link from "next/link";
import { clerkEnabled } from "@/lib/clerk";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "./logo";
import { isCheckinDoneToday } from "@/app/checkin/actions";

export async function Nav() {
  let userId: string | null = null;
  if (clerkEnabled) {
    const session = await auth();
    userId = session.userId;
  }
  const signedIn = Boolean(userId);
  const checkinDone = signedIn ? await isCheckinDoneToday() : false;

  return (
    <header className="hairline-b sticky top-0 z-50 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <Logo size={28} />
          <span className="mono text-sm font-semibold tracking-[0.25em]">
            EL COACH <span className="text-[color:var(--color-gold)]">METHOD</span>
          </span>
        </Link>
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
            <>
              {checkinDone ? (
                <Link href="/dashboard" className="btn-ghost">Mon Dashboard</Link>
              ) : (
                <Link href="/checkin" className="btn-ghost">Mon check-in du jour</Link>
              )}
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

