"use client";

import { useClerk } from "@clerk/nextjs";
import { useT } from "@/lib/i18n/provider";

export function AccountSignOutButton() {
  const { signOut } = useClerk();
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className="btn-home-secondary"
      style={{ maxWidth: 420, cursor: "pointer" }}
    >
      {t("su.account.signOut")}
    </button>
  );
}
