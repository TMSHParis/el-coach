import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { BackHomeButton } from "@/components/back-home-button";
import type { EcmScore } from "@/lib/coaching-adaptatif-mock";

export const metadata = { title: "Historique des check-ins — EL COACH METHOD" };

export default async function CheckinsHistoryPage() {
  const userId = await getUserId();
  const [checkins, outputs] = userId
    ? await Promise.all([
        prisma.checkin.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 }),
        prisma.dashboardOutput.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 }),
      ])
    : [[], []];
  const ecmByDate = new Map(
    outputs.map((o) => [o.date, (o.output as { ecm?: EcmScore } | null)?.ecm ?? null]),
  );

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e0e0e0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 0" }}>
        <BackHomeButton href="/settings" label="← Réglages" />
        <div style={{ fontFamily: "var(--font-bebas, sans-serif)", fontSize: 28, letterSpacing: 3, color: "#fff" }}>
          Historique des check-ins
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 60px" }}>
        {checkins.length === 0 && <p style={{ color: "#8a8a8a", fontSize: 13 }}>Pas encore de check-in enregistré.</p>}
        {checkins.map((c) => {
          const ecm = ecmByDate.get(c.date);
          return (
            <div
              key={c.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#111", border: "1px solid #1f1f1f", borderRadius: 8, marginBottom: 6 }}
            >
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{c.date}</div>
                <div style={{ color: "#8a8a8a", fontSize: 11, marginTop: 2 }}>{c.seance ?? "Séance non précisée"}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#8a8a8a" }}>
                {ecm ? (
                  <span style={{ color: "#C9A84C", fontWeight: 700 }}>{ecm.letter} · {ecm.numeric}/100</span>
                ) : (
                  "—"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
