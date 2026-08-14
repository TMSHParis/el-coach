import { redirect } from "next/navigation";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { toDisplayBlocks, defaultRuntimeFormat, defaultDurationMinutes } from "@/lib/session-format";
import { minutesToHM } from "../dashboard/dashboard-helpers";
import { SessionRunnerV2 } from "./session-runner-v2";
import { sessionFontVariables } from "./session-fonts";

export const metadata = { title: "Séance en cours — EL COACH METHOD" };

export default async function SessionPage() {
  const demo = await getDemoState();
  if (!demo.programSlug) redirect("/onboarding");

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore);
  if (!today || today.needsFatigueInput || today.day.blocks.length === 0) {
    redirect("/dashboard");
  }

  const displayBlocks = toDisplayBlocks(today.day.blocks);
  const initial = today.day.blocks.map((b) => ({
    format: defaultRuntimeFormat(b),
    durationMin: defaultDurationMinutes(b),
    tabataRounds: b.rounds ?? 8,
  }));

  return (
    <div className={sessionFontVariables}>
      <SessionRunnerV2
        sessionName={`${today.template.name} — ${today.day.focus}`}
        sessionMeta={`${minutesToHM(today.day.estimatedMinutes)} · ${displayBlocks.length} blocs`}
        blocks={displayBlocks}
        initial={initial}
      />
    </div>
  );
}
