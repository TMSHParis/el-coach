"use client";

import { SignIn } from "@clerk/nextjs";
import { clerkEnabledClient } from "@/lib/clerk";
import styles from "./ecm-signup.module.css";

const APPEARANCE = {
  variables: { colorPrimary: "#e8ff00", colorBackground: "#080808", colorText: "#f0ede8" },
};

/** Connexion Clerk (hébergée) intégrée dans une page — jamais sur sa propre route catch-all. */
export function EcmInlineSignIn({ redirectTo }: { redirectTo: string }) {
  if (!clerkEnabledClient) {
    return (
      <p style={{ color: "#8a8a8a", fontSize: "0.9rem" }}>
        Connexion indisponible — Clerk n&apos;est pas configuré.
      </p>
    );
  }
  return <SignIn routing="hash" fallbackRedirectUrl={redirectTo} appearance={APPEARANCE} />;
}

/** Onglet "Déjà inscrit" — connexion simple, redirige vers /checkin. */
export function EcmSignInForm() {
  return (
    <div className={styles.updateGate}>
      <div className={styles.logo}>
        EL <span>COACH</span>
      </div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 600 }}>Content de te revoir.</h2>
      <EcmInlineSignIn redirectTo="/checkin" />
    </div>
  );
}
