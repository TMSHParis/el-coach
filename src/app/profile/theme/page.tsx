import { ThemeScreen } from "./theme-screen";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";

export const metadata = { title: "Mon bloc d'entraînement · EL COACH METHOD" };

export default function ThemePage() {
  return (
    <div className={ecmFontVariables}>
      <ThemeScreen />
    </div>
  );
}
