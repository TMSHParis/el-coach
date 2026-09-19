"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Visible uniquement sur la page d'accueil — ailleurs, chaque page bare a déjà son propre header. */
export function ProfileIcon({
  signedIn,
  imageUrl,
  initial,
}: {
  signedIn: boolean;
  imageUrl: string | null;
  initial: string;
}) {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <Link href={signedIn ? "/account" : "/signin"} aria-label="Mon compte">
      {signedIn && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar Clerk externe, taille fixe 36px
        <img src={imageUrl} alt="" className="h-9 w-9 rounded-full border border-white/20 object-cover" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-semibold text-white">
          {initial}
        </span>
      )}
    </Link>
  );
}
