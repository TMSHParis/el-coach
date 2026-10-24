import { Check } from "lucide-react";
import { ApplyForm } from "./apply-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("lg.apply.meta") };
}

export default async function ApplyPage() {
  const { t } = await getT();
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="label">{t("lg.apply.label")}</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
        {t("lg.apply.h1a")}
        <br />
        <span className="text-[color:var(--c-8a8a8a)]">{t("lg.apply.h1b")}</span>
      </h1>
      <p className="mt-6 max-w-2xl text-[color:var(--c-8a8a8a)]">
        {t("lg.apply.intro")}
      </p>

      <div className="mt-10 grid gap-px bg-[var(--c-1f1f1f)] md:grid-cols-3">
        <Perk title={t("lg.apply.perk1.title")} body={t("lg.apply.perk1.body")} />
        <Perk title={t("lg.apply.perk2.title")} body={t("lg.apply.perk2.body")} />
        <Perk title={t("lg.apply.perk3.title")} body={t("lg.apply.perk3.body")} />
      </div>

      <ApplyForm />
    </section>
  );
}

function Perk({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[var(--c-0a0a0a)] p-6">
      <Check size={16} />
      <div className="mono mt-4 text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm text-[color:var(--c-8a8a8a)]">{body}</p>
    </div>
  );
}
