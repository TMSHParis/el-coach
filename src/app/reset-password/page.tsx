import { Suspense } from "react";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { ResetPasswordForm } from "./reset-password-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.reset") };
}

export default async function ResetPasswordPage() {
  const { t } = await getT();
  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader
        title={t("su.reset.title")}
        subtitle={t("su.reset.sub")}
        backHref="/"
      />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
