import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { stripeEnabled } from "@/lib/stripe";
import { isAdmin } from "@/lib/access";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { getT } from "@/lib/i18n/server";
import { SettingsView } from "./settings-view";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("st.pageTitle") };
}

export default async function SettingsPage() {
  const { t, lang } = await getT();
  const userId = await getUserId();
  const admin = await isAdmin();
  const profile = userId ? await prisma.profile.findUnique({ where: { userId } }) : null;

  if (!profile) {
    return (
      <section className={`mx-auto max-w-lg px-6 py-24 text-center ${ecmFontVariables}`} style={{ background: "var(--c-080808)", minHeight: "100vh", color: "var(--c-e0e0e0)" }}>
        <div className="label">{t("st.sectionLabel")}</div>
        <h1 className="mt-4 text-2xl font-semibold" style={{ color: "var(--c-ffffff)" }}>{t("st.signInPrompt")}</h1>
      </section>
    );
  }

  return (
    <div className={ecmFontVariables}>
      <SettingsView
        profile={{
          prenom: profile.prenom,
          // Comptes antérieurs à sept. 2026 : pas encore de liste, on part du programme unique.
          programmes: profile.programmes.length > 0 ? profile.programmes : [profile.programme].filter(Boolean),
          recordsRm: (profile.recordsRm as Record<string, string> | null) ?? {},
          notifCheckinOn: profile.notifCheckinOn,
          notifCheckinTime: profile.notifCheckinTime ?? "07:00",
          notifSeance: profile.notifSeance,
          notifBlessure: profile.notifBlessure,
          notifRecap: profile.notifRecap,
          langue: profile.langue,
          theme: profile.theme,
          timezone: profile.timezone,
        }}
        priceLabel={t("st.price.month", { price: formatPrice(PROGRAM_BASE_PRICE_CENTS, "EUR", lang) })}
        stripeEnabled={stripeEnabled}
        isAdmin={admin}
      />
    </div>
  );
}
