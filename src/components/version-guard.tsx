"use client";

// Mise à jour automatique (partie 6, mission 5) : à l'ouverture de l'app et à chaque retour au premier plan,
// on compare l'identifiant de déploiement de la page à celui du serveur ; s'ils diffèrent, on recharge la page.
// Aucune séance en cours n'est perdue : son état est relu depuis le stockage de l'appareil.

import { useEffect } from "react";

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export function VersionGuard() {
  useEffect(() => {
    if (BUILD_ID === "dev") return;
    let last = 0;
    async function check() {
      if (document.visibilityState !== "visible" || Date.now() - last < 30_000) return;
      last = Date.now();
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { id } = (await res.json()) as { id?: string };
        if (id && id !== "dev" && id !== BUILD_ID) {
          // Une seule tentative par version : jamais de boucle de rechargement.
          const key = `elc_reload_${id}`;
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, "1");
          window.location.reload();
        }
      } catch {
        // Hors ligne : on réessaiera au prochain retour au premier plan.
      }
    }
    void check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return null;
}
