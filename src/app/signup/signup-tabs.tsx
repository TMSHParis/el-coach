"use client";

import { useState } from "react";
import { EcmSignupForm } from "./ecm-signup-form";
import { EcmUpdateForm } from "./ecm-update-form";
import { EcmSignInForm } from "./ecm-signin-form";
import { cx } from "./ecm-shared";
import styles from "./ecm-signup.module.css";

type Tab = "welcome" | "update" | "login";

const TABS: { id: Tab; label: string }[] = [
  { id: "welcome", label: "Bienvenue" },
  { id: "update", label: "J'ai changé" },
  { id: "login", label: "Déjà inscrit" },
];

export function SignupTabs({
  initialTab,
  defaultProgramSlug,
}: {
  initialTab: Tab;
  defaultProgramSlug: string;
}) {
  const [active, setActive] = useState<Tab>(initialTab);

  return (
    <>
      <div className={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cx(styles.tabBtn, active === t.id && styles.tabBtnActive)}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "welcome" && <EcmSignupForm defaultProgramSlug={defaultProgramSlug} />}
      {active === "update" && <EcmUpdateForm />}
      {active === "login" && <EcmSignInForm />}
    </>
  );
}
