"use client";

import { useClerk } from "@clerk/nextjs";

export function AccountSignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className="btn-home-secondary"
      style={{ maxWidth: 420, cursor: "pointer" }}
    >
      Déconnexion
    </button>
  );
}
