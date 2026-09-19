import { Suspense } from "react";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Nouveau mot de passe · EL COACH METHOD" };

export default function ResetPasswordPage() {
  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader
        title="Nouveau mot de passe."
        subtitle="Saisis le code reçu par email et ton nouveau mot de passe."
        backHref="/"
      />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
