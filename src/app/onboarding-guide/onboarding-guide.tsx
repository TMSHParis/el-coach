"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { markOnboardingDone } from "@/app/signup/actions";
import { EcmPageHeader } from "@/app/signup/ecm-shared";

const STEPS = [
  { n: "①", name: "Check-in du matin", desc: "2 minutes. Énergie, sommeil, corps, mental." },
  { n: "②", name: "Analyse instantanée", desc: "Moins de 5 secondes." },
  { n: "③", name: "Plan sur mesure", desc: "Séance · stack · récupération." },
];

export function OnboardingGuide() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firstName = searchParams.get("firstName");
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await markOnboardingDone();
    router.push("/checkin");
  }

  return (
    <>
      {screen === 1 && (
        <>
          <EcmPageHeader
            title="Bienvenue dans ton Coaching Adaptatif."
            subtitle="Voici comment ça fonctionne."
          />
          <Center>
            <button className="btn-gold" onClick={() => setScreen(2)}>
              Suivant →
            </button>
          </Center>
        </>
      )}

      {screen === 2 && (
        <>
          <EcmPageHeader title="3 étapes simples." />
          <Center>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 380, textAlign: "left" }}>
              {STEPS.map((s) => (
                <div key={s.name} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: "1.6rem" }}>{s.n}</div>
                  <div>
                    <div style={{ color: "#f0ede8", fontWeight: 700 }}>{s.name}</div>
                    <div style={{ color: "#8a8a8a", fontSize: "0.85rem", marginTop: 2 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-gold" style={{ marginTop: 32 }} onClick={() => setScreen(3)}>
              Suivant →
            </button>
          </Center>
        </>
      )}

      {screen === 3 && (
        <>
          <EcmPageHeader title="C'est parti." subtitle={firstName ? `${firstName}, fais ton premier check-in.` : "Fais ton premier check-in."} />
          <Center>
            <button className="btn-gold" disabled={busy} onClick={finish}>
              {busy ? "…" : "Faire mon premier check-in →"}
            </button>
          </Center>
        </>
      )}
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="mx-auto flex max-w-lg flex-col items-center px-6 pb-20 text-center"
      style={{ background: "#080808", minHeight: "40vh" }}
    >
      {children}
    </section>
  );
}
