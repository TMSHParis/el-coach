"use client";

import { useEffect } from "react";
import { PageError, errorMessageFor } from "@/components/page-error";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("DashboardError:", error);
  }, [error]);
  return (
    <PageError
      message={errorMessageFor(error, "Une erreur est survenue au chargement du dashboard. Réessaie — tes données ne sont pas perdues.")}
      onRetry={reset}
    />
  );
}
