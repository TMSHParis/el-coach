"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Strength = { label: string; level: 0 | 1 | 2 | 3; color: string };

function computeStrength(pwd: string): Strength {
  if (pwd.length === 0) return { label: "—", level: 0, color: "var(--color-line)" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: "Faible", level: 1, color: "#ef4444" };
  if (score <= 4) return { label: "Moyen", level: 2, color: "#e8ff00" };
  return { label: "Fort", level: 3, color: "#22c55e" };
}

export function PasswordField({
  name,
  required,
  minLength = 6,
}: {
  name: string;
  required?: boolean;
  minLength?: number;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const strength = computeStrength(value);

  return (
    <label className="block">
      <span className="label">Mot de passe</span>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          name={name}
          required={required}
          minLength={minLength}
          autoComplete="new-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border border-[color:var(--color-line)] bg-transparent p-2.5 pr-10 text-base focus:border-[color:var(--color-accent)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--color-mute)] hover:text-white"
          aria-label={show ? "Masquer" : "Afficher"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-1 transition-colors"
            style={{
              background: strength.level >= n ? strength.color : "var(--color-line)",
            }}
          />
        ))}
      </div>
      <div className="mono mt-1 text-[10px] tracking-[0.15em] text-[color:var(--color-mute)]">
        Sécurité : <span style={{ color: strength.color }}>{strength.label.toUpperCase()}</span>
        {value.length > 0 && value.length < minLength && " · 6 caractères minimum"}
      </div>
    </label>
  );
}
