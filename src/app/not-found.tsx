import Link from "next/link";

export const metadata = { title: "Page introuvable — EL COACH METHOD" };

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="gold-shimmer text-8xl font-black tracking-tight md:text-9xl">404</div>
      <p className="mt-6 text-lg text-[color:var(--color-mute)]">Cette page n&apos;existe pas.</p>
      <Link href="/" className="btn-gold mt-8 inline-flex">
        Retour à l&apos;accueil
      </Link>
    </section>
  );
}
