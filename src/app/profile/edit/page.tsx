import { ProfileEditForm } from "./profile-edit-form";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";

export const metadata = { title: "Modifier mon profil · EL COACH METHOD" };

export default function ProfileEditPage() {
  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title="Je mets à jour mon profil" />
      <ProfileEditForm />
    </div>
  );
}
