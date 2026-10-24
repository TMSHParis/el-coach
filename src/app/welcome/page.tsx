import Link from "next/link";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { getTemplate } from "@/lib/programming";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("su.meta.welcome") };
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ firstName?: string; programme?: string }>;
}) {
  const { firstName, programme } = await searchParams;
  const { t } = await getT();
  const programName = (programme && getTemplate(programme)?.name) || programme || t("su.welcome.yourProgram");

  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title={t("su.guide.title3")} />
      <section className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 pb-20 text-center" style={{ background: "var(--c-080808)" }}>
        <p style={{ color: "var(--c-f0ede8)", fontSize: "1.1rem" }}>
          {firstName ? t("su.welcome.name", { name: firstName }) : t("su.welcome.dot")} {t("su.welcome.active")}
        </p>
        <div
          style={{
            width: "100%",
            padding: 20,
            border: "1px solid rgba(232,255,0,0.25)",
            background: "rgba(232,255,0,0.04)",
            borderRadius: 8,
            textAlign: "left",
          }}
        >
          <div style={{ color: "var(--c-e8ff00)", fontWeight: 700, letterSpacing: 1, fontSize: "0.85rem", textTransform: "uppercase" }}>
            {programName}
          </div>
          <div style={{ color: "var(--c-f0ede8)", fontSize: "1.4rem", fontWeight: 700, marginTop: 6 }}>
            {formatPrice(PROGRAM_BASE_PRICE_CENTS)} <span style={{ fontSize: "0.8rem", color: "var(--c-8a8a8a)", fontWeight: 400 }}>{t("su.welcome.perMonth")}</span>
          </div>
          <div style={{ color: "var(--c-8a8a8a)", fontSize: "0.8rem", marginTop: 6 }}>{t("su.welcome.trial")}</div>
        </div>
        <Link
          href={{ pathname: "/onboarding-guide", query: { firstName } }}
          className="btn-gold"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {t("su.guide.cta")}
        </Link>
      </section>
    </div>
  );
}
