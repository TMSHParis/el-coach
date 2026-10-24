"use client";

import { useEffect } from "react";
import { PageError, errorMessageFor } from "@/components/page-error";
import { useT } from "@/lib/i18n/provider";

export default function ProfileEditError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("ProfileEditError:", error);
  }, [error]);
  return (
    <PageError
      message={errorMessageFor(error, t("su.edit.error"))}
      onRetry={reset}
    />
  );
}
