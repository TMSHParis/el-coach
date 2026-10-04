"use client";

import { useEffect } from "react";
import { PageError, errorMessageFor } from "@/components/page-error";

export default function ProfileEditError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("ProfileEditError:", error);
  }, [error]);
  return (
    <PageError
      message={errorMessageFor(error, "Une erreur est survenue en chargeant ton profil. Réessaie.")}
      onRetry={reset}
    />
  );
}
