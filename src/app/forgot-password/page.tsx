import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { ForgotPasswordForm } from "./forgot-password-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.forgot") };
}

export default async function ForgotPasswordPage() {
  const { t } = await getT();
  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader
        title={t("su.forgot.title")}
        subtitle={t("su.forgot.sub")}
        backHref="/"
      />
      <ForgotPasswordForm />
    </div>
  );
}
