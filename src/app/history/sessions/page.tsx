import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { BackHomeButton } from "@/components/back-home-button";

export const metadata = { title: "Historique des séances — EL COACH METHOD" };

export default async function SessionsHistoryPage() {
  const userId = await getUserId();
  const sessions = userId
    ? await prisma.session.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 })
    : [];

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e0e0e0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 0" }}>
        <BackHomeButton href="/settings" label="← Réglages" />
        <div style={{ fontFamily: "var(--font-bebas, sans-serif)", fontSize: 28, letterSpacing: 3, color: "#fff" }}>
          Historique des séances
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 60px" }}>
        {sessions.length === 0 && <p style={{ color: "#8a8a8a", fontSize: 13 }}>Pas encore de séance enregistrée.</p>}
        {sessions.map((s) => (
          <div
            key={s.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, marginBottom: 6 }}
          >
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{s.date}</div>
              <div style={{ color: "#8a8a8a", fontSize: 11, marginTop: 2 }}>Variante {s.variant ?? "—"}</div>
            </div>
            <div style={{ fontSize: 12, color: s.completed ? "#86efac" : "#8a8a8a", fontWeight: 600 }}>
              {s.completed ? "Terminée" : "Non terminée"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
