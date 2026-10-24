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
} as const satisfies Entries;
