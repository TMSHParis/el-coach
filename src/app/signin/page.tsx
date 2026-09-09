import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";

export const metadata = { title: "Connexion · EL COACH METHOD" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/checkin";

  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title="Content de te revoir." />
      <section className="grid place-items-center px-6 pb-16" style={{ background: "#080808" }}>
        {clerkEnabled ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl={redirectTo}
            appearance={{
              variables: { colorPrimary: "#e8ff00", colorBackground: "#080808", colorText: "#f0ede8" },
            }}
          />
        ) : (
          <p style={{ color: "#8a8a8a" }}>Clerk non configuré.</p>
        )}
      </section>
    </div>
  );
}
