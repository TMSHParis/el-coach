import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";

export const metadata = { title: "Connexion · EL COACH METHOD" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reset?: string }>;
}) {
  const { redirect, reset } = await searchParams;
  const redirectTo = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/checkin";

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
            appearance={{
              variables: { colorPrimary: "#e8ff00", colorBackground: "#080808", colorText: "#f0ede8" },
              elements: {
                formFieldInput: {
                  backgroundColor: "#1a1a1a",
                  borderColor: "#444",
                  color: "#fff",
                  "&::placeholder": { color: "#888" },
                },
              },
            }}
          />
        ) : (
          <p style={{ color: "#8a8a8a" }}>Clerk non configuré.</p>
        )}
        <Link href="/forgot-password" style={{ color: "#8a8a8a", fontSize: "0.85rem" }}>
          Mot de passe oublié ?
        </Link>
      </section>
    </div>
  );
}
