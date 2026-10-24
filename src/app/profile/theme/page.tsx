import { ThemeScreen } from "./theme-screen";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.theme") };
}

export default function ThemePage() {
  return (
    <div className={ecmFontVariables}>
      <ThemeScreen />
    </div>
  );
}
