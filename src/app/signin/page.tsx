import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { clerkSignInAppearance } from "@/lib/clerk-appearance";

export const metadata = { title: "Connexion · EL COACH METHOD" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reset?: string }>;
}) {
  const { redirect, reset } = await searchParams;
  // Après connexion → accueil (qui affiche l'état connecté), sauf si on arrive
  // ici redirigé depuis une page protégée (middleware) : on y renvoie.
  const redirectTo = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";

  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title="Content de te revoir." backHref="/" />
      <section className="grid place-items-center gap-4 px-6 pb-16" style={{ background: "#080808" }}>
        {reset === "1" && (
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              padding: 16,
              borderLeft: "2px solid #00ff88",
              background: "rgba(0, 255, 136, 0.05)",
              color: "#f0ede8",
              fontSize: "0.9rem",
            }}
          >
            Mot de passe mis à jour ✅
          </div>
        )}
        {clerkEnabled ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl={redirectTo}
            appearance={clerkSignInAppearance}
          />
        ) : (
          <p style={{ color: "#8a8a8a" }}>Clerk non configuré.</p>
        )}
        <Link href="/forgot-password" style={{ color: "#8a8a8a", fontSize: "0.85rem" }}>
          Mot de passe oublié ?
        </Link>
        <p style={{ color: "#666", fontSize: "0.85rem" }}>
          Pas encore inscrit ?{" "}
          <Link href="/signup" style={{ color: "#E8FF00", letterSpacing: 1 }}>
            JE M&apos;INSCRIS
          </Link>
        </p>
      </section>
    </div>
  );
}
