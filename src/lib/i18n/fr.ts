// Source de vérité des textes de l'interface. en.ts et es.ts doivent avoir exactement les mêmes clés.
// Les noms de mouvements, de programmes (CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block, At Home)
// et de formats (For Time, AMRAP, EMOM, Tabata) ne sont JAMAIS traduits : ils ne passent pas par ici.
export const fr = {
  // Navigation
  "nav.home": "← Accueil",
  "nav.back": "← Retour",
  "nav.backAria": "Retour",
  "nav.scrollTop": "Remonter en haut",

  // Section Demain
  "tomorrow.title": "DEMAIN",
  "tomorrow.restName": "Repos",
  "tomorrow.restSub": "Ta semaine prévoit du repos",
  "tomorrow.nonEcm": "Sport hors ECM",
  "tomorrow.tipWarmup": "Échauffement",
  "tomorrow.tipZone": "Zone à ménager",
  "tomorrow.tipSport": "Conseil du sport",
} as const;

export type DictKey = keyof typeof fr;
