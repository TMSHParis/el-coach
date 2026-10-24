"use client";

import { useT } from "@/lib/i18n/provider";

/** Écran de chargement générique pour les pages protégées — évite le flash de contenu vide. */
export function PageLoading({ label }: { label?: string }) {
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
        background: "var(--c-080808)",
        color: "var(--c-8a8a8a)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid var(--c-222222)",
          borderTopColor: "var(--c-e8ff00)",
          borderRadius: "50%",
          animation: "el-coach-spin 0.8s linear infinite",
        }}
      />
      <div style={{ fontSize: 12, letterSpacing: 1 }}>{label ?? t("app.loading")}</div>
      <style>{`@keyframes el-coach-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
