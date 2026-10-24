import type { Entries } from "../types";

// Textes communs : navigation, boutons génériques, section Demain, réglages (partie 5).
export const core = {
  "nav.home": ["← Accueil", "← Home", "← Inicio"],
  "nav.back": ["← Retour", "← Back", "← Atrás"],
  "nav.backAria": ["Retour", "Back", "Atrás"],
  "nav.scrollTop": ["Remonter en haut", "Back to top", "Volver arriba"],

  "tomorrow.title": ["DEMAIN", "TOMORROW", "MAÑANA"],
  "tomorrow.restName": ["Repos", "Rest", "Descanso"],
  "tomorrow.restSub": ["Ta semaine prévoit du repos", "Your week plans rest", "Tu semana prevé descanso"],
  "tomorrow.nonEcm": ["Sport hors ECM", "Non-ECM sport", "Deporte fuera de ECM"],
  "tomorrow.tipWarmup": ["Échauffement", "Warm-up", "Calentamiento"],
  "tomorrow.tipZone": ["Zone à ménager", "Area to protect", "Zona a cuidar"],
  "tomorrow.tipSport": ["Conseil du sport", "Sport tip", "Consejo del deporte"],

  "nav.account": ["Mon compte", "My account", "Mi cuenta"],
  "meta.title": [
    "EL COACH METHOD — Ton Coaching Adaptatif personnel",
    "EL COACH METHOD — Your personal Adaptive Coaching",
    "EL COACH METHOD — Tu Coaching Adaptativo personal",
  ],
  "meta.description": [
    "Un check-in chaque matin. Un plan sur mesure chaque jour. Séance adaptée, stack compléments, récupération ciblée — tout généré en moins de 5 secondes. 5 programmes en base : CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block Hypertrophy, At Home.",
    "A check-in every morning. A tailor-made plan every day. Adapted session, supplement stack, targeted recovery — all generated in under 5 seconds. 5 programs: CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block Hypertrophy, At Home.",
    "Un check-in cada mañana. Un plan a medida cada día. Sesión adaptada, stack de suplementos, recuperación específica — todo generado en menos de 5 segundos. 5 programas: CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block Hypertrophy, At Home.",
  ],
  "clerk.signupPrompt": ["Pas encore inscrit ?", "Not registered yet?", "¿Aún no te has registrado?"],
  "err.generic": ["Erreur inattendue.", "Unexpected error.", "Error inesperado."],
} as const satisfies Entries;
