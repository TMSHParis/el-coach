import { redirect } from "next/navigation";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { resolveDayState } from "@/lib/ecm-engine";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { getT } from "@/lib/i18n/server";
import { MindsetView } from "./mindset-view";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("ci.mindset.title") };
}

/** Page intermédiaire affichée après validation du check-in, avant le dashboard. */
export default async function MindsetPage() {
  const userId = await getUserId();
  const date = todayKey();
  const [output, checkin] = userId
    ? await Promise.all([
        prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date } } }),
        prisma.checkin.findUnique({ where: { userId_date: { userId, date } } }),
      ])
    : [null, null];

  const stored = output?.output as { mindsetMessage?: string; ecm?: { state?: "green" | "yellow" | "red" } } | null;
  const message = stored?.mindsetMessage;

  // Pas de plan généré aujourd'hui (accès direct à l'URL) — rien à afficher.
  if (!message) redirect("/dashboard");

  return (
    <div className={ecmFontVariables}>
      <MindsetView message={message} state={resolveDayState(stored?.ecm?.state, checkin)} />
    </div>
  );
}
