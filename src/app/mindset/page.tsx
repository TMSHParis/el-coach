import { redirect } from "next/navigation";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { MindsetView } from "./mindset-view";

export const metadata = { title: "Mindset du jour — EL COACH METHOD" };

/** Page intermédiaire affichée après validation du check-in, avant le dashboard. */
export default async function MindsetPage() {
  const userId = await getUserId();
  const output = userId
    ? await prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: todayKey() } } })
    : null;
  const message = (output?.output as { mindsetMessage?: string } | null)?.mindsetMessage;

  // Pas de plan généré aujourd'hui (accès direct à l'URL) — rien à afficher.
  if (!message) redirect("/dashboard");

  return (
    <div className={ecmFontVariables}>
      <MindsetView message={message} />
    </div>
  );
}
