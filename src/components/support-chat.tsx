"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Crisp } from "crisp-sdk-web";

/** Crisp ne doit être configuré qu'une fois par chargement de page. */
let configured = false;

/**
 * Tchat de support Crisp — visible uniquement pour les abonnés connectés.
 * Monté dans le layout racine, à l'intérieur du ClerkProvider.
 */
export function SupportChat({ websiteId }: { websiteId: string }) {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Visiteur non connecté : pas de widget (et on cache celui d'une session
      // précédente si l'utilisateur vient de se déconnecter).
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
  }, [isLoaded, isSignedIn, user, websiteId]);

  return null;
}
