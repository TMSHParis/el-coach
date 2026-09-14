import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { clerkEnabled } from "@/lib/clerk";

export async function GET() {
  if (!clerkEnabled) return Response.json({ error: "Connexion requise." }, { status: 401 });
  const session = await auth();
  const userId = session.userId;
  if (!userId) return Response.json({ error: "Connecte-toi d'abord." }, { status: 401 });

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
