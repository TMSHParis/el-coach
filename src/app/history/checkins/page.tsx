import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { BackHomeButton } from "@/components/back-home-button";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import type { EcmScore } from "@/lib/coaching-adaptatif-mock";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("app.history.checkins.meta") };
}

export default async function CheckinsHistoryPage() {
  const { t } = await getT();
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
    <div className={ecmFontVariables} style={{ background: "var(--c-080808)", minHeight: "100vh", color: "var(--c-e0e0e0)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 0" }}>
        <BackHomeButton />
        <div style={{ fontFamily: "var(--font-bebas, sans-serif)", fontSize: 28, letterSpacing: 3, color: "var(--c-ffffff)" }}>
          {t("app.history.checkins.title")}
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 60px" }}>
        {checkins.length === 0 && <p style={{ color: "var(--c-8a8a8a)", fontSize: 13 }}>{t("app.history.checkins.empty")}</p>}
        {checkins.map((c) => {
          const ecm = ecmByDate.get(c.date);
          return (
            <div
              key={c.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--c-111111)", border: "1px solid var(--c-1f1f1f)", borderRadius: 8, marginBottom: 6 }}
            >
              <div>
                <div style={{ color: "var(--c-ffffff)", fontSize: 13, fontWeight: 600 }}>{c.date}</div>
                <div style={{ color: "var(--c-8a8a8a)", fontSize: 11, marginTop: 2 }}>{c.seance ?? t("app.history.checkins.noSession")}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "var(--c-8a8a8a)" }}>
                {ecm ? (
                  <span style={{ color: "var(--c-c9a84c)", fontWeight: 700 }}>{ecm.letter} · {ecm.numeric}/100</span>
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
