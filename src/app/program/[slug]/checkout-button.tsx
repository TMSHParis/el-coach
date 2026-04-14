"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export function CheckoutButton({
  programSlug,
  programTitle,
}: {
  programSlug: string;
  programTitle: string;
}) {
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
      if (!res.ok) throw new Error(data.error ?? "Checkout indisponible");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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
        aria-label={`Souscrire à ${programTitle}`}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
        {loading ? "Redirection..." : "Commencer le programme"}
      </button>
      {error && <p className="mono mt-3 text-xs text-red-400">{error}</p>}
    </>
  );
}
