"use client";

import { PageError } from "@/components/page-error";

export default function CheckinError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageError
      message="Une erreur est survenue. Ton plan sera généré au prochain essai."
      onRetry={reset}
    />
  );
}
