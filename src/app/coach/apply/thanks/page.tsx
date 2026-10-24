import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("lg.thanks.meta") };
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const { t } = await getT();
  return (
    <section className="mx-auto max-w-2xl px-6 py-28 text-center">
      <CheckCircle2 size={40} className="mx-auto" />
      <div className="label mt-6">{t("lg.thanks.label")}</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
        {t("lg.thanks.h1")}
      </h1>
      {id && (
        <p className="mono mt-6 text-sm text-[color:var(--c-8a8a8a)]">
          {t("lg.thanks.ref")} <span className="text-white">{id}</span>
        </p>
      )}
      <p className="mt-6 text-[color:var(--c-8a8a8a)]">
        {t("lg.thanks.body")}
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/marketplace" className="btn-ghost">{t("lg.thanks.explore")}</Link>
        <Link href="/" className="btn-primary">{t("lg.thanks.home")}</Link>
      </div>
    </section>
  );
}
