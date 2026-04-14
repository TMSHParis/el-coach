import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";

export default function SignInPage() {
  if (!clerkEnabled) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24">
        <div className="label">[ AUTH / DEMO ]</div>
        <h1 className="mt-4 text-3xl font-semibold">Clerk non configuré</h1>
        <p className="mt-3 text-[color:var(--color-mute)]">
          Ajoute tes clés Clerk dans Vercel pour activer le sign-in.
        </p>
      </section>
    );
  }
  return (
    <section className="grid min-h-[70vh] place-items-center px-6 py-16">
      <SignIn
        appearance={{
          variables: { colorPrimary: "#ffffff", colorBackground: "#000000", colorText: "#ffffff" },
        }}
      />
    </section>
  );
}
