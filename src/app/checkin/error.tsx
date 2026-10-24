"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/provider";
import { PageError, errorMessageFor } from "@/components/page-error";

export default function CheckinError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("CheckinError:", error);
  }, [error]);
  return (
    <PageError
      message={errorMessageFor(error, t("ci.error.generic"))}
      onRetry={reset}
    />
  );
}
