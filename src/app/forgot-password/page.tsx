import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Mot de passe oublié · EL COACH METHOD" };

export default function ForgotPasswordPage() {
  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader
        title="Mot de passe oublié."
        subtitle="On t'envoie un code pour le réinitialiser."
        backHref="/signin"
        backLabel="← Connexion"
      />
      <ForgotPasswordForm />
    </div>
  );
}
