import { EcmSignupForm } from "./ecm-signup-form";
import { EcmPageHeader } from "./ecm-shared";
import { ecmFontVariables } from "./ecm-fonts";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.signup") };
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;
  const { t } = await getT();

  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader
        title={t("su.welcome.dot")}
        subtitle={t("su.signup.sub", { price: formatPrice(PROGRAM_BASE_PRICE_CENTS) })}
        backHref="/"
      />
      <EcmSignupForm defaultProgramSlug={program ?? ""} />
    </div>
  );
}
