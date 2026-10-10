"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Crisp } from "crisp-sdk-web";

/** Crisp ne doit être configuré qu'une fois par chargement de page. */
let configured = false;

/** Bulle réservée à la landing page publique (route "/", avant connexion) —
 * ailleurs dans l'app connectée elle chevauchait des éléments d'interface
 * (ex. bouton "← Retour" du chrono plein écran, dashboard, check-in...). */
const BUBBLE_ROUTE = "/";

/**
 * Tchat de support Crisp — visible uniquement sur la landing page publique
 * (voir BUBBLE_ROUTE ci-dessus), connecté ou non. Monté dans le layout
 * racine, à l'intérieur du ClerkProvider.
 */
export function SupportChat({ websiteId }: { websiteId: string }) {
  const { isLoaded, user } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;

    if (pathname !== BUBBLE_ROUTE) {
      // Pas sur la landing page : pas de bulle (et on cache celle d'une
      // page/session précédente si elle était affichée).
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
  }, [isLoaded, user, websiteId, pathname]);

  return null;
}
