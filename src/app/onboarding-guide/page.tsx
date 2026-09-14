import { Suspense } from "react";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { OnboardingGuide } from "./onboarding-guide";

export const metadata = { title: "Bienvenue — EL COACH METHOD" };

export default function OnboardingGuidePage() {
  return (
    <div className={ecmFontVariables}>
      <Suspense>
        <OnboardingGuide />
      </Suspense>
    </div>
  );
}
