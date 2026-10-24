"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { markOnboardingDone } from "@/app/signup/actions";
import { EcmPageHeader } from "@/app/signup/ecm-shared";
import { useT } from "@/lib/i18n/provider";

const STEPS = [
  { n: "①", name: "su.guide.step1.name", desc: "su.guide.step1.desc" },
  { n: "②", name: "su.guide.step2.name", desc: "su.guide.step2.desc" },
  { n: "③", name: "su.guide.step3.name", desc: "su.guide.step3.desc" },
] as const;

export function OnboardingGuide() {
  const router = useRouter();
  const t = useT();
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
            title={t("su.guide.title1")}
            subtitle={t("su.guide.sub1")}
          />
          <Center>
            <button className="btn-gold" onClick={() => setScreen(2)}>
              {t("su.guide.next")}
            </button>
          </Center>
        </>
      )}

      {screen === 2 && (
        <>
          <EcmPageHeader title={t("su.guide.title2")} />
          <Center>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 380, textAlign: "left" }}>
              {STEPS.map((s) => (
                <div key={s.name} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: "1.6rem" }}>{s.n}</div>
                  <div>
                    <div style={{ color: "var(--c-f0ede8)", fontWeight: 700 }}>{t(s.name)}</div>
                    <div style={{ color: "var(--c-8a8a8a)", fontSize: "0.85rem", marginTop: 2 }}>{t(s.desc)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-gold" style={{ marginTop: 32 }} onClick={() => setScreen(3)}>
              {t("su.guide.next")}
            </button>
          </Center>
        </>
      )}

      {screen === 3 && (
        <>
          <EcmPageHeader title={t("su.guide.title3")} subtitle={firstName ? t("su.guide.sub3Name", { name: firstName }) : t("su.guide.sub3")} />
          <Center>
            <button className="btn-gold" disabled={busy} onClick={finish}>
              {busy ? "…" : t("su.guide.cta")}
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
      style={{ background: "var(--c-080808)", minHeight: "40vh" }}
    >
      {children}
    </section>
  );
}
