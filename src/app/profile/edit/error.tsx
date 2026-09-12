"use client";

import { PageError } from "@/components/page-error";

export default function ProfileEditError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageError
      message="Une erreur est survenue en chargeant ton profil. Réessaie."
      onRetry={reset}
    />
  );
}
