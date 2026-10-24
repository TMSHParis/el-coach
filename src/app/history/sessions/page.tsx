import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { BackHomeButton } from "@/components/back-home-button";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("app.history.sessions.meta") };
}

export default async function SessionsHistoryPage() {
  const { t } = await getT();
  const userId = await getUserId();
  const sessions = userId
    ? await prisma.session.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 60 })
    : [];

  return (
    <div className={ecmFontVariables} style={{ background: "var(--c-080808)", minHeight: "100vh", color: "var(--c-e0e0e0)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 0" }}>
        <BackHomeButton />
        <div style={{ fontFamily: "var(--font-bebas, sans-serif)", fontSize: 28, letterSpacing: 3, color: "var(--c-ffffff)" }}>
          {t("app.history.sessions.title")}
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 60px" }}>
        {sessions.length === 0 && <p style={{ color: "var(--c-8a8a8a)", fontSize: 13 }}>{t("app.history.sessions.empty")}</p>}
        {sessions.map((s) => (
          <div
            key={s.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--c-111111)", border: "1px solid var(--c-1f1f1f)", borderRadius: 8, marginBottom: 6 }}
          >
            <div>
              <div style={{ color: "var(--c-ffffff)", fontSize: 13, fontWeight: 600 }}>{s.date}</div>
              <div style={{ color: "var(--c-8a8a8a)", fontSize: 11, marginTop: 2 }}>{t("app.history.sessions.variant", { v: s.variant ?? "—" })}</div>
            </div>
            <div style={{ fontSize: 12, color: s.completed ? "var(--c-86efac)" : "var(--c-8a8a8a)", fontWeight: 600 }}>
              {s.completed ? t("app.history.sessions.done") : t("app.history.sessions.notDone")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
