import { UserProfile } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { clerkEcmAppearance } from "@/lib/clerk-appearance";
import { AccountSignOutButton } from "./sign-out-button";

export const metadata = { title: "Mon compte · EL COACH METHOD" };

/** Page compte Clerk native (photo, email, sécurité) + déconnexion — cible de l'icône profil. */
export default function AccountPage() {
  return (
    <div className={ecmFontVariables} style={{ background: "#080808", minHeight: "100vh" }}>
      <EcmPageHeader title="Mon compte." backHref="/" />
      <section className="grid place-items-center gap-6 px-4 pb-16">
        {clerkEnabled ? (
          <>
            <UserProfile routing="hash" appearance={clerkEcmAppearance} />
            <AccountSignOutButton />
          </>
        ) : (
          <p style={{ color: "#8a8a8a" }}>Clerk non configuré.</p>
        )}
      </section>
    </div>
  );
}
