import { Suspense } from "react";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { OnboardingGuide } from "./onboarding-guide";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.welcome") };
}

export default function OnboardingGuidePage() {
  return (
    <div className={ecmFontVariables}>
      <Suspense>
        <OnboardingGuide />
      </Suspense>
    </div>
  );
}
