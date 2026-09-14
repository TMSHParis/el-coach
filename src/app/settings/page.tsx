import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { PROGRAM_BASE_PRICE_CENTS } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { stripeEnabled } from "@/lib/stripe";
import { SettingsView } from "./settings-view";

export const metadata = { title: "Réglages — EL COACH METHOD" };

export default async function SettingsPage() {
  const userId = await getUserId();
  const profile = userId ? await prisma.profile.findUnique({ where: { userId } }) : null;

  if (!profile) {
    return (
      <section className="mx-auto max-w-lg px-6 py-24 text-center" style={{ background: "#080808", minHeight: "100vh", color: "#e0e0e0" }}>
        <div className="label">[ RÉGLAGES ]</div>
        <h1 className="mt-4 text-2xl font-semibold" style={{ color: "#fff" }}>Connecte-toi pour accéder à tes réglages.</h1>
      </section>
    );
  }

  return (
    <SettingsView
      profile={{
        prenom: profile.prenom,
        programme: profile.programme,
        recordsRm: (profile.recordsRm as Record<string, string> | null) ?? {},
        notifCheckinOn: profile.notifCheckinOn,
        notifCheckinTime: profile.notifCheckinTime ?? "07:30",
        notifSeance: profile.notifSeance,
        notifBlessure: profile.notifBlessure,
        notifRecap: profile.notifRecap,
        langue: profile.langue,
      }}
      priceLabel={`${formatPrice(PROGRAM_BASE_PRICE_CENTS)} / mois`}
      stripeEnabled={stripeEnabled}
    />
  );
}
