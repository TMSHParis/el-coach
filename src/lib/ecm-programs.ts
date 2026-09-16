// Les 5 programmes ECM catalogués — libellé (tel qu'affiché dans les <select>
// de signup/checkin) → slug de programmation (programming.ts). Module neutre
// (pas de directive "use client"/"use server") : importé aussi bien depuis du
// code client (ecm-shared.tsx) que depuis des Server Actions ("use server" —
// un import direct depuis un fichier "use client" ne s'y résout pas de façon
// fiable à l'exécution) et des Server Components.
export const SPORT_LABEL_TO_SLUG: Record<string, string> = {
  "⚡ CrossFit Pure": "crossfit-pure",
  "🔥 Hybrid Engine": "hybrid-cf-strength",
  "🏁 Hyrox Pure": "hyrox-pure",
  "💪 Volume Block Hypertrophy": "volume-block-hypertrophy",
  "🏠 At Home": "at-home",
};

export const SLUG_TO_SPORT_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SPORT_LABEL_TO_SLUG).map(([label, slug]) => [slug, label]),
);
