import Link from "next/link";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { getTemplate } from "@/lib/programming";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Bienvenue — EL COACH METHOD" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ firstName?: string; programme?: string }>;
}) {
  const { firstName, programme } = await searchParams;
  const programName = (programme && getTemplate(programme)?.name) || programme || "ton programme";

  return (
    <div className={ecmFontVariables}>
      <EcmPageHeader title="C'est parti." />
      <section className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 pb-20 text-center" style={{ background: "#080808" }}>
        <p style={{ color: "#f0ede8", fontSize: "1.1rem" }}>
          {firstName ? `Bienvenue, ${firstName}.` : "Bienvenue."} Ton Coaching Adaptatif est activé.
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
          <div style={{ color: "#e8ff00", fontWeight: 700, letterSpacing: 1, fontSize: "0.85rem", textTransform: "uppercase" }}>
            {programName}
          </div>
          <div style={{ color: "#f0ede8", fontSize: "1.4rem", fontWeight: 700, marginTop: 6 }}>
            {formatPrice(PROGRAM_BASE_PRICE_CENTS)} <span style={{ fontSize: "0.8rem", color: "#8a8a8a", fontWeight: 400 }}>/ mois</span>
          </div>
          <div style={{ color: "#8a8a8a", fontSize: "0.8rem", marginTop: 6 }}>Free Trial 7 jours · aucun débit avant la fin de l&apos;essai</div>
        </div>
        <Link
          href={{ pathname: "/onboarding-guide", query: { firstName } }}
          className="btn-gold"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Faire mon premier check-in →
        </Link>
      </section>
    </div>
  );
}
