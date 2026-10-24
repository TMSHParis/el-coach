"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import styles from "@/app/signup/ecm-signup.module.css";
import { useT } from "@/lib/i18n/provider";

export function ForgotPasswordForm() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const ok = email.includes("@");
    setEmailError(!ok);
    if (!ok || !signIn) return;

    setBusy(true);
    setError(null);
    try {
      const { error: createErr } = await signIn.create({ identifier: email });
      if (createErr) {
        setBusy(false);
        setError(createErr.message ?? t("su.forgot.notFound"));
        return;
      }
      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode();
      setBusy(false);
      if (sendErr) {
        setError(sendErr.message ?? t("su.forgot.sendFail"));
        return;
      }
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error("ForgotPasswordForm.handleSubmit:", err);
      setBusy(false);
      setError(t("su.techError"));
    }
  }

  return (
    <div className={styles.ecmRoot} style={{ minHeight: "auto" }}>
      <div className={styles.right} style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className={styles.field}>
          <label>{t("su.email")}</label>
          <input
            type="email"
            placeholder={t("su.emailPh")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={emailError ? styles.fieldError : undefined}
          />
          {emailError && <span className={`${styles.fieldHint} ${styles.errorMsg} ${styles.show}`}>{t("su.emailInvalid")}</span>}
        </div>
        {error && (
          <div className="mb-4 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        <button className={styles.btnNext} type="button" disabled={busy} onClick={handleSubmit}>
          {busy ? t("su.forgot.sending") : t("su.forgot.send")} <span className={styles.arrow}>→</span>
        </button>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/signin" style={{ color: "var(--accent, var(--c-e8ff00))", fontSize: "0.85rem" }}>
            {t("su.forgot.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
