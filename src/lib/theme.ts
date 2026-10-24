// Thème de l'interface (partie 5, mission 4C). Module neutre (client et serveur).
export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "dark";
export const THEME_COOKIE = "ecm_theme";
export const isTheme = (v: unknown): v is Theme => typeof v === "string" && (THEMES as readonly string[]).includes(v);

const YEAR = 60 * 60 * 24 * 365;

/** Applique le thème tout de suite (sans recharger) et le mémorise dans un cookie lu par le serveur. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${YEAR}; samesite=lax`;
}
