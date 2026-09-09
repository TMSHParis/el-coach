import { EcmSignupForm } from "./ecm-signup-form";
import { EcmPageHeader } from "./ecm-shared";
import { ecmFontVariables } from "./ecm-fonts";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Inscription Free Trial — 7 jours offerts · EL COACH METHOD" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;

  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader
        title="Bienvenue."
        subtitle={`Ton Coaching Adaptatif à ${formatPrice(PROGRAM_BASE_PRICE_CENTS)} / mois`}
      />
      <EcmSignupForm defaultProgramSlug={program ?? ""} />
    </div>
  );
}
