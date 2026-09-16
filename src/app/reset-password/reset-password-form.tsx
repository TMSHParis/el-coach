"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { validatePassword } from "@/app/signup/ecm-shared";
import styles from "@/app/signup/ecm-signup.module.css";

export function ResetPasswordForm() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finalizeSession() {
    if (!signIn) return;
    await signIn.finalize({
      navigate: async ({ decorateUrl }) => {
        const url = decorateUrl("/signin?reset=1");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function handleSubmit() {
    const pwErr = validatePassword(password);
    setPasswordError(pwErr);
    if (pwErr || !signIn) return;

    setBusy(true);
    setError(null);
    try {
      const { error: codeErr } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (codeErr) {
        setBusy(false);
        setError(codeErr.message ?? "Code invalide.");
        return;
      }
      const { error: pwErrRes } = await signIn.resetPasswordEmailCode.submitPassword({ password });
      setBusy(false);
      if (pwErrRes) {
        setError(pwErrRes.message ?? "Impossible de mettre à jour le mot de passe.");
        return;
      }
      if (signIn.status === "complete") {
        await finalizeSession();
      } else {
        router.push("/signin?reset=1");
      }
    } catch (err) {
      console.error("ResetPasswordForm.handleSubmit:", err);
      setBusy(false);
      setError("Erreur technique — réessaie.");
    }
  }

  return (
    <div className={styles.ecmRoot} style={{ minHeight: "auto" }}>
      <div className={styles.right} style={{ maxWidth: 420, margin: "0 auto" }}>
        {email && <p style={{ color: "#8a8a8a", fontSize: "0.85rem", marginBottom: 16 }}>Code envoyé à <strong>{email}</strong>.</p>}
        <div className={styles.field}>
          <label>Code reçu par email</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
        <div className={styles.field}>
          <label>Nouveau mot de passe</label>
          <div className={styles.fieldPw}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="15 caractères min. · 1 chiffre · 1 symbole"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className={styles.pwToggle} type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "CACHER" : "VOIR"}
            </button>
          </div>
          {passwordError && <span className={`${styles.fieldHint} ${styles.errorMsg} ${styles.show}`}>{passwordError}</span>}
        </div>
        {error && (
          <div className="mb-4 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        <button className={styles.btnNext} type="button" disabled={busy || code.length < 6} onClick={handleSubmit}>
          {busy ? "Mise à jour…" : "Réinitialiser mon mot de passe"} <span className={styles.arrow}>→</span>
        </button>
      </div>
    </div>
  );
}
