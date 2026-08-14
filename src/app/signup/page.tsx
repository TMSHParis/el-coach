import { EcmSignupForm } from "./ecm-signup-form";
import { ecmFontVariables } from "./ecm-fonts";

export const metadata = { title: "Inscription Free Trial — 7 jours offerts · EL COACH METHOD" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;

  return (
    <div className={ecmFontVariables}>
      <EcmSignupForm defaultProgramSlug={program ?? ""} />
    </div>
  );
}
