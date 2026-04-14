import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Candidature envoyée — EL COACH" };

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <section className="mx-auto max-w-2xl px-6 py-28 text-center">
      <CheckCircle2 size={40} className="mx-auto" />
      <div className="label mt-6">[ CANDIDATURE REÇUE ]</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
        Merci. On te répond sous 72h.
      </h1>
      {id && (
        <p className="mono mt-6 text-sm text-[#8a8a8a]">
          Référence : <span className="text-white">{id}</span>
        </p>
      )}
      <p className="mt-6 text-[#8a8a8a]">
        Un humain lit chaque candidature. Si ton profil match, on organise un call pour cadrer la
        publication de ton premier programme.
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/marketplace" className="btn-ghost">Explorer la marketplace</Link>
        <Link href="/" className="btn-primary">Retour accueil</Link>
      </div>
    </section>
  );
}
