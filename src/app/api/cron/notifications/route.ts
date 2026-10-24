import { NextResponse, type NextRequest } from "next/server";
import { runNotifications } from "@/lib/notifications/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Appelée par la tâche planifiée Vercel (vercel.json) avec `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await runNotifications();
  return NextResponse.json({ ok: true, ...report });
}
