"use client";

import { useEffect } from "react";
import { PageError, errorMessageFor } from "@/components/page-error";

export default function CheckinError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("CheckinError:", error);
  }, [error]);
  return (
    <PageError
      message={errorMessageFor(error, "Une erreur est survenue. Ton plan sera généré au prochain essai.")}
      onRetry={reset}
    />
  );
}
