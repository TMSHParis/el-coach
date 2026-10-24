"use client";

import { makeT, type Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";

/** Message adapté à la cause probable plutôt qu'un "connexion perdue" générique
 * trompeur — un crash de rendu serveur n'a presque jamais à voir avec la
 * connexion de l'utilisateur. `fallback` est le message par défaut quand la
 * cause ne peut pas être affinée (ni réseau détecté, ni timeout serveur). */
export function errorMessageFor(error: Error, fallback: string, t: Translate = makeT("fr")): string {
  const text = `${error.name} ${error.message}`.toLowerCase();
  if (
    text.includes("fetch failed") ||
    text.includes("econnrefused") ||
    text.includes("can't reach database") ||
    text.includes("timeout") ||
    text.includes("timed out")
  ) {
    return t("app.error.slow");
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return t("app.error.offline");
  }
  return fallback;
}

/** Écran d'erreur générique pour les pages protégées (Next.js error boundary). */
export function PageError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const t = useT();
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 24px",
        background: "var(--c-080808)",
        color: "var(--c-f0ede8)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 2, color: "var(--c-e8ff00)", textTransform: "uppercase" }}>
        {t("app.error.tag")}
      </div>
      <p style={{ maxWidth: 360, color: "var(--c-8a8a8a)", fontSize: "0.9rem" }}>{message ?? t("app.error.default")}</p>
      <button
        onClick={onRetry}
        style={{
          background: "var(--c-e8ff00)",
          color: "var(--on-accent)",
          border: "none",
          borderRadius: 4,
          padding: "10px 20px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
        }}
      >
        {t("app.error.retry")}
      </button>
    </div>
  );
}
