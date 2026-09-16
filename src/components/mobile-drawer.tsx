"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export function MobileDrawer({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const close = () => setOpen(false);

  const checkinHref = signedIn ? "/checkin" : "/signin?redirect=/checkin";
  const profileHref = signedIn ? "/profile/edit" : "/signin?redirect=/profile/edit";

  async function handleSignOut() {
    close();
    await signOut();
    router.push("/");
  }

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
      >
        <span className="h-[2px] w-5 bg-white" />
        <span className="h-[2px] w-5 bg-white" />
        <span className="h-[2px] w-5 bg-white" />
      </button>

      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-[60] bg-black/70 transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed left-0 top-0 z-[70] h-full w-[280px] max-w-[80vw] border-r border-[#222] bg-[#111] transition-transform duration-[250ms] ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <span className="mono text-xs font-semibold tracking-[0.25em] text-white">
            EL COACH <span className="text-[color:var(--color-gold)]">METHOD</span>
          </span>
          <button type="button" aria-label="Fermer" onClick={close} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 py-2 text-sm text-white/80">
          <Link href="/" onClick={close} className="rounded px-3 py-3 hover:bg-white/5 hover:text-white">
            🏠 Accueil
          </Link>
          <Link href="/dashboard" onClick={close} className="rounded px-3 py-3 hover:bg-white/5 hover:text-white">
            📋 Mon Dashboard
          </Link>
          <Link href={checkinHref} onClick={close} className="rounded px-3 py-3 hover:bg-white/5 hover:text-white">
            ✅ Mon check-in du jour
          </Link>
          <Link href={profileHref} onClick={close} className="rounded px-3 py-3 hover:bg-white/5 hover:text-white">
            ✏️ Je mets à jour mon profil
          </Link>
          <div className="my-2 border-t border-[#222]" />
          <Link href="/settings" onClick={close} className="rounded px-3 py-3 hover:bg-white/5 hover:text-white">
            ⚙️ Réglages
          </Link>
          {signedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded px-3 py-3 text-left hover:bg-white/5 hover:text-white"
            >
              🚪 Déconnexion
            </button>
          )}
        </nav>
      </div>
    </>
  );
}
