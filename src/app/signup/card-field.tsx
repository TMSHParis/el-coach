"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

export function CardField() {
  const [value, setValue] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
    const groups = digits.match(/.{1,4}/g) ?? [];
    setValue(groups.join("  "));
  }

  return (
    <label className="block">
      <span className="label">Numéro de carte</span>
      <div className="relative mt-1">
        <input
          type="text"
          name="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          required
          value={value}
          onChange={handleChange}
          placeholder="××××  ××××  ××××  ××××"
          className="mono w-full border border-[color:var(--color-line)] bg-transparent p-2.5 pr-10 text-base tracking-wider placeholder:text-[color:var(--color-mute)] focus:border-[color:var(--color-accent)] focus:outline-none"
        />
        <CreditCard
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-mute)]"
        />
      </div>
    </label>
  );
}
