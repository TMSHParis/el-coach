import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { clerkSignInAppearance } from "@/lib/clerk-appearance";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.signin") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reset?: string }>;
}) {
  const { redirect, reset } = await searchParams;
  const { t } = await getT();
  // Après connexion → accueil (qui affiche l'état connecté), sauf si on arrive
  // ici redirigé depuis une page protégée (middleware) : on y renvoie.
  const redirectTo = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";

  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title={t("su.signin.title")} backHref="/" />
      <section className="grid place-items-center gap-4 px-6 pb-16" style={{ background: "var(--c-080808)" }}>
        {reset === "1" && (
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              padding: 16,
              borderLeft: "2px solid var(--c-00ff88)",
              background: "rgba(0, 255, 136, 0.05)",
              color: "var(--c-f0ede8)",
              fontSize: "0.9rem",
            }}
          >
            {t("su.signin.resetDone")}
          </div>
        )}
        {clerkEnabled ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl={redirectTo}
            appearance={clerkSignInAppearance}
          />
        ) : (
          <p style={{ color: "var(--c-8a8a8a)" }}>{t("su.clerkOff")}</p>
        )}
        <Link href="/forgot-password" style={{ color: "var(--c-8a8a8a)", fontSize: "0.85rem" }}>
          {t("su.signin.forgot")}
        </Link>
        <p style={{ color: "var(--ct-666666)", fontSize: "0.85rem" }}>
          {t("su.signin.noAccount")}{" "}
          <Link href="/signup" style={{ color: "var(--c-e8ff00)", letterSpacing: 1 }}>
            {t("su.signin.signup")}
          </Link>
        </p>
      </section>
    </div>
  );
}
