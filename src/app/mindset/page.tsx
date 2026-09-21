import { redirect } from "next/navigation";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { isRestDay } from "@/lib/ecm-engine";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { MindsetView, type MindsetState } from "./mindset-view";

export const metadata = { title: "Mindset du jour — EL COACH METHOD" };

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
      <MindsetView message={message} state={resolveState(stored?.ecm?.state, checkin)} />
    </div>
  );
}

/** État du jour : score ECM quand il existe, sinon l'énergie du check-in. */
function resolveState(
  ecmState: "green" | "yellow" | "red" | undefined,
  checkin: { energie: number | null; seance: string | null } | null,
): MindsetState {
  if (isRestDay(checkin?.seance)) return "repos";
  if (ecmState) return ecmState === "green" ? "vert" : ecmState === "yellow" ? "jaune" : "rouge";
  const energie = checkin?.energie ?? 5;
  if (energie >= 8) return "vert";
  if (energie >= 5) return "jaune";
  return "rouge";
}
