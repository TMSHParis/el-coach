import { SignupTabs } from "./signup-tabs";
import { ecmFontVariables } from "./ecm-fonts";

export const metadata = { title: "Inscription Free Trial — 7 jours offerts · EL COACH METHOD" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; tab?: string }>;
}) {
  const { program, tab } = await searchParams;
  const initialTab = tab === "update" ? "update" : tab === "login" ? "login" : "welcome";

  return (
    <div className={ecmFontVariables}>
      <SignupTabs initialTab={initialTab} defaultProgramSlug={program ?? ""} />
    </div>
  );
}
