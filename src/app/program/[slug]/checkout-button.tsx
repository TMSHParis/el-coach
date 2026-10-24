"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export function CheckoutButton({
  programSlug,
  programTitle,
}: {
  programSlug: string;
  programTitle: string;
}) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("lg.checkout.unavailable"));
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("lg.checkout.error"));
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
        aria-label={t("lg.checkout.subscribe", { title: programTitle })}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
        {loading ? t("lg.checkout.redirecting") : t("lg.checkout.start")}
      </button>
      {error && <p className="mono mt-3 text-xs text-red-400">{error}</p>}
    </>
  );
}
