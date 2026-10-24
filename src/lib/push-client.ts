"use client";

// Abonnement aux notifications push de l'app web (partie 5, mission 4A). Client uniquement.
import { savePushSubscription } from "@/app/settings/actions";

export type EnableResult = { ok: true } | { ok: false; reason: "unsupported" | "ios-install" | "denied" | "error" };

export const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

/** iPhone / iPad hors mode « écran d'accueil » : le push web n'y fonctionne pas. */
export function needsIosInstall(): boolean {
  if (typeof navigator === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return ios && !standalone;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const b64 = (buf: ArrayBuffer | null) => (buf ? btoa(String.fromCharCode(...new Uint8Array(buf))) : "");

/** Demande l'autorisation, enregistre le service worker et l'abonnement (côté serveur : profil). */
export async function enablePush(): Promise<EnableResult> {
  if (needsIosInstall()) return { ok: false, reason: "ios-install" };
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  if (Notification.permission === "denied") return { ok: false, reason: "denied" };
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return { ok: false, reason: "error" };
  try {
    await navigator.serviceWorker.register("/sw.js");
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
    const res = await savePushSubscription({
      endpoint: sub.endpoint,
      p256dh: b64(sub.getKey("p256dh")),
      auth: b64(sub.getKey("auth")),
      userAgent: navigator.userAgent,
      timezone: deviceTimezone(),
    });
    return res.ok ? { ok: true } : { ok: false, reason: "error" };
  } catch (err) {
    console.error("Abonnement push impossible", err);
    return { ok: false, reason: "error" };
  }
}
