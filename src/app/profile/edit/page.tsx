import { ProfileEditForm } from "./profile-edit-form";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.profileEdit") };
}

export default async function ProfileEditPage() {
  const { t } = await getT();
  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title={t("su.edit.title")} backHref="/" />
      <ProfileEditForm />
    </div>
  );
}
