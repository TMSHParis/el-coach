import { ThemeScreen } from "./theme-screen";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";

export const metadata = { title: "Choisis ton thème · EL COACH METHOD" };

export default function ThemePage() {
  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title="Mon bloc d'entraînement" backHref="/profile/edit" />
      <ThemeScreen />
    </div>
  );
}
