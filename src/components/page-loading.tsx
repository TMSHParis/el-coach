/** Écran de chargement générique pour les pages protégées — évite le flash de contenu vide. */
export function PageLoading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#080808",
        color: "#8a8a8a",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #222",
          borderTopColor: "#e8ff00",
          borderRadius: "50%",
          animation: "el-coach-spin 0.8s linear infinite",
        }}
      />
      <div style={{ fontSize: 12, letterSpacing: 1 }}>{label}</div>
      <style>{`@keyframes el-coach-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
