"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Crisp } from "crisp-sdk-web";

/** Crisp ne doit être configuré qu'une fois par chargement de page. */
let configured = false;

/** Bulle réservée à l'accueil (dashboard) — ailleurs elle chevauchait des
 * éléments d'interface (ex. bouton "← Retour" du chrono plein écran). */
const BUBBLE_ROUTE = "/dashboard";

/**
 * Tchat de support Crisp — visible uniquement pour les abonnés connectés,
 * et seulement sur la route d'accueil (voir BUBBLE_ROUTE ci-dessus).
 * Monté dans le layout racine, à l'intérieur du ClerkProvider.
 */
export function SupportChat({ websiteId }: { websiteId: string }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || pathname !== BUBBLE_ROUTE) {
      // Visiteur non connecté, ou pas sur l'accueil : pas de bulle (et on
      // cache celle d'une page/session précédente si elle était affichée).
      if (configured) Crisp.chat.hide();
      return;
    }

    if (!configured) {
      Crisp.configure(websiteId);
      configured = true;
    }
    Crisp.chat.show();

    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) Crisp.user.setEmail(email);
    if (user?.firstName) Crisp.user.setNickname(user.firstName);
  }, [isLoaded, isSignedIn, user, websiteId, pathname]);

  return null;
}
