"use client";

import { PageError } from "@/components/page-error";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageError
      message="Connexion perdue. Vérifie ta connexion internet, puis réessaie."
      onRetry={reset}
    />
  );
}
