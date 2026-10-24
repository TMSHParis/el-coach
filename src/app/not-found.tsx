import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("app.notFound.title") };
}

export default async function NotFound() {
  const { t } = await getT();
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="gold-shimmer text-8xl font-black tracking-tight md:text-9xl">404</div>
      <p className="mt-6 text-lg text-[color:var(--color-mute)]">{t("app.notFound.text")}</p>
      <Link href="/" className="btn-gold mt-8 inline-flex">
        {t("app.notFound.back")}
      </Link>
    </section>
  );
}
