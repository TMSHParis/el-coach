"use client";

/** Écran d'erreur générique pour les pages protégées (Next.js error boundary). */
export function PageError({
  message = "Une erreur est survenue. Ton plan sera généré au prochain essai.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
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
        background: "#080808",
        color: "#f0ede8",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 2, color: "#e8ff00", textTransform: "uppercase" }}>
        [ Erreur ]
      </div>
      <p style={{ maxWidth: 360, color: "#8a8a8a", fontSize: "0.9rem" }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          background: "#e8ff00",
          color: "#000",
          border: "none",
          borderRadius: 4,
          padding: "10px 20px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
