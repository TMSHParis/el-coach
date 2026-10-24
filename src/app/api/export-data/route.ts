import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { clerkEnabled } from "@/lib/clerk";
import { getT } from "@/lib/i18n/server";

export async function GET() {
  const { t } = await getT();
  if (!clerkEnabled) return Response.json({ error: t("app.api.signinRequired") }, { status: 401 });
  const session = await auth();
  const userId = session.userId;
  if (!userId) return Response.json({ error: t("app.api.signinFirst") }, { status: 401 });

  const [profile, checkins, dashboardOutputs, sessions] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.checkin.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.dashboardOutput.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.session.findMany({ where: { userId }, orderBy: { date: "asc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
    checkins,
    dashboardOutputs,
    sessions,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="el-coach-method-donnees.json"`,
    },
  });
}
