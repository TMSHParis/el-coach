"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export function MobileDrawer({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  // Le header parent a un backdrop-blur, qui crée un containing block CSS pour
  // les descendants `position: fixed` — ça casse le plein écran du drawer.
  // On rend donc le drawer/overlay dans un portail vers <body>, hors du header
  // — document.body n'existe que côté client, d'où ce hook plutôt qu'un accès direct.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { signOut } = useClerk();
  const router = useRouter();

  const close = () => setOpen(false);

  async function handleSignOut() {
    close();
    await signOut();
    router.push("/");
  }

  const overlayAndDrawer = (
    <>
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-[60] bg-black/70 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed left-0 top-0 z-[70] h-full w-[70%] max-w-[320px] border-r border-[#222] bg-[#080808] transition-transform duration-[250ms] ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="mono text-xs font-semibold tracking-[0.25em] text-white">
            EL COACH <span className="text-[color:var(--color-gold)]">METHOD</span>
          </span>
          <button type="button" aria-label="Fermer" onClick={close} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-5 py-2">
          <Link
            href="/dashboard"
            onClick={close}
            className="py-3 text-xl uppercase tracking-[0.08em] text-white/90 hover:text-white"
            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
          >
            Mon Dashboard
          </Link>
          <div className="my-2 border-t border-[#222]" />
          <Link
            href="/settings"
            onClick={close}
            className="py-3 text-xl uppercase tracking-[0.08em] text-white/90 hover:text-white"
            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
          >
            Réglages
          </Link>
          {signedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              className="py-3 text-left text-xl uppercase tracking-[0.08em] text-white/60 hover:text-white"
              style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
            >
              Déconnexion
            </button>
          )}
        </nav>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
      >
        <span className="h-[1.5px] w-5 bg-white" />
        <span className="h-[1.5px] w-5 bg-white" />
        <span className="h-[1.5px] w-5 bg-white" />
      </button>
      {mounted && createPortal(overlayAndDrawer, document.body)}
    </>
  );
}
