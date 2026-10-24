import { UserProfile } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { clerkEcmAppearance } from "@/lib/clerk-appearance";
import { AccountSignOutButton } from "./sign-out-button";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.account") };
}

/** Page compte Clerk native (photo, email, sécurité) + déconnexion — cible de l'icône profil. */
export default async function AccountPage() {
  const { t } = await getT();
  return (
    <div className={ecmFontVariables} style={{ background: "var(--c-080808)", minHeight: "100vh" }}>
      <EcmPageHeader title={t("su.account.title")} backHref="/" />
      <section className="grid place-items-center gap-6 px-4 pb-16">
        {clerkEnabled ? (
          <>
            <UserProfile routing="hash" appearance={clerkEcmAppearance} />
            <AccountSignOutButton />
          </>
        ) : (
          <p style={{ color: "var(--c-8a8a8a)" }}>{t("su.clerkOff")}</p>
        )}
      </section>
    </div>
  );
}
