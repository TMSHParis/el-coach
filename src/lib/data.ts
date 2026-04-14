export type Coach = {
  slug: string;
  name: string;
  handle: string;
  title: string;
  bio: string;
  specialties: string[];
  location: string;
  rating: number;
  athletes: number;
  yearsExp: number;
};

export type Program = {
  slug: string;
  title: string;
  coachSlug: string;
  category: "STRENGTH" | "HYPERTROPHY" | "CONDITIONING" | "ENDURANCE" | "MOBILITY";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  weeks: number;
  sessionsPerWeek: number;
  priceCents: number;
  priceIntervalLabel: string;
  description: string;
  equipment: string[];
  outcomes: string[];
};

export const coaches: Coach[] = [
  {
    slug: "nora-saidi",
    name: "Nora Saïdi",
    handle: "@nora.saidi",
    title: "S&C Coach · Powerlifting",
    bio: "Ex-compétitrice IPF, 10 ans de plateau. J'écris des cycles périodisés pour athlètes qui veulent des PR mesurables, pas des séances Instagram.",
    specialties: ["Powerlifting", "Force", "Périodisation"],
    location: "Paris, FR",
    rating: 4.9,
    athletes: 412,
    yearsExp: 10,
  },
  {
    slug: "karim-benali",
    name: "Karim Benali",
    handle: "@karim.benali",
    title: "Hybrid Athlete Coach",
    bio: "Hybride force + endurance. Méthode testée sur 300+ athlètes. Run fort, soulève lourd, récupère bien.",
    specialties: ["Hybrid", "Hyrox", "Conditioning"],
    location: "Lyon, FR",
    rating: 4.8,
    athletes: 687,
    yearsExp: 8,
  },
  {
    slug: "amina-ouadah",
    name: "Amina Ouadah",
    handle: "@amina.ouadah",
    title: "Hypertrophy · Physique",
    bio: "Bodybuilding naturel. Programmation volume/fréquence, nutrition inclusive. Aucune magie, que du stimulus et de la récup.",
    specialties: ["Hypertrophie", "Physique", "Nutrition"],
    location: "Marseille, FR",
    rating: 4.9,
    athletes: 523,
    yearsExp: 7,
  },
  {
    slug: "yanis-mehdaoui",
    name: "Yanis Mehdaoui",
    handle: "@yanis.mhd",
    title: "Endurance · Trail",
    bio: "Ultra-trail 100k+. Plans zone 2 lourds, seuils précis, tapering qui marche pour le D-Day.",
    specialties: ["Trail", "Marathon", "Zone 2"],
    location: "Chamonix, FR",
    rating: 4.7,
    athletes: 234,
    yearsExp: 12,
  },
  {
    slug: "sofia-kader",
    name: "Sofia Kader",
    handle: "@sofia.kader",
    title: "Mobility · Prehab",
    bio: "Kiné du sport. Protocoles mobilité quotidiens, prévention blessures pour athlètes de force.",
    specialties: ["Mobilité", "Prehab", "Récupération"],
    location: "Toulouse, FR",
    rating: 5.0,
    athletes: 189,
    yearsExp: 9,
  },
  {
    slug: "omar-tahiri",
    name: "Omar Tahiri",
    handle: "@omar.tahiri",
    title: "CrossFit · Competitor",
    bio: "Regional CrossFit, coach affilié. Programmation conjugate pour athlètes fonctionnels.",
    specialties: ["CrossFit", "Conditioning", "Gymnastique"],
    location: "Bordeaux, FR",
    rating: 4.8,
    athletes: 356,
    yearsExp: 6,
  },
];

export const programs: Program[] = [
  {
    slug: "iron-protocol-12",
    title: "Iron Protocol · 12 semaines",
    coachSlug: "nora-saidi",
    category: "STRENGTH",
    level: "INTERMEDIATE",
    weeks: 12,
    sessionsPerWeek: 4,
    priceCents: 4900,
    priceIntervalLabel: "/mois",
    description:
      "Cycle périodisé en 3 blocs (accumulation, intensification, réalisation). Objectif : +15kg sur total SBD en 12 semaines.",
    equipment: ["Barre", "Rack", "Bench"],
    outcomes: ["Total +15kg", "Technique SBD propre", "Force max testée"],
  },
  {
    slug: "hybrid-engine",
    title: "Hybrid Engine",
    coachSlug: "karim-benali",
    category: "CONDITIONING",
    level: "ADVANCED",
    weeks: 16,
    sessionsPerWeek: 6,
    priceCents: 5900,
    priceIntervalLabel: "/mois",
    description:
      "Programme hybride force + endurance. Double séance 3x/semaine, cible Hyrox ou athlète polyvalent.",
    equipment: ["Barre", "Rameur", "Assault bike", "Kettlebell"],
    outcomes: ["Sub-70min Hyrox", "Squat 2×PDC", "VO2 en hausse"],
  },
  {
    slug: "volume-block",
    title: "Volume Block · Hypertrophy",
    coachSlug: "amina-ouadah",
    category: "HYPERTROPHY",
    level: "INTERMEDIATE",
    weeks: 8,
    sessionsPerWeek: 5,
    priceCents: 3900,
    priceIntervalLabel: "/mois",
    description:
      "Bloc volume haute fréquence, split Upper/Lower/Push/Pull/Legs. Progression série/rep autopilotée.",
    equipment: ["Salle complète"],
    outcomes: ["Masse maigre +2-3kg", "Volume hebdo optimisé", "RIR maîtrisé"],
  },
  {
    slug: "sub3-marathon",
    title: "Sub-3 Marathon",
    coachSlug: "yanis-mehdaoui",
    category: "ENDURANCE",
    level: "ADVANCED",
    weeks: 16,
    sessionsPerWeek: 5,
    priceCents: 4900,
    priceIntervalLabel: "/mois",
    description:
      "Plan marathon sub-3h. Seuils précis, sorties longues progressives, tapering 3 semaines.",
    equipment: ["Running"],
    outcomes: ["Sub-3h marathon", "Seuil +0:10/km", "Semaine 60-80km"],
  },
  {
    slug: "daily-mobility",
    title: "Daily Mobility · 30 jours",
    coachSlug: "sofia-kader",
    category: "MOBILITY",
    level: "BEGINNER",
    weeks: 4,
    sessionsPerWeek: 7,
    priceCents: 1900,
    priceIntervalLabel: "/mois",
    description:
      "Routine 15min/jour pour débloquer hanches, épaules, thoracique. Pensé pour lifters.",
    equipment: ["Tapis", "Bande"],
    outcomes: ["Squat plus profond", "Overhead propre", "Moins de douleurs"],
  },
  {
    slug: "conjugate-engine",
    title: "Conjugate Engine",
    coachSlug: "omar-tahiri",
    category: "CONDITIONING",
    level: "ADVANCED",
    weeks: 10,
    sessionsPerWeek: 5,
    priceCents: 4900,
    priceIntervalLabel: "/mois",
    description:
      "Programmation conjuguée pour CrossFit compétiteur. ME / DE / WOD thématisé.",
    equipment: ["Box complète"],
    outcomes: ["Fran sub-3min", "Snatch +10kg", "Engine testé"],
  },
  {
    slug: "strong-starter",
    title: "Strong Starter · 8 semaines",
    coachSlug: "nora-saidi",
    category: "STRENGTH",
    level: "BEGINNER",
    weeks: 8,
    sessionsPerWeek: 3,
    priceCents: 2900,
    priceIntervalLabel: "/mois",
    description:
      "Linear progression pour débutants. 3 séances full-body, apprentissage technique solide.",
    equipment: ["Barre", "Rack"],
    outcomes: ["Squat PDC × 1.5", "Bench PDC", "Deadlift PDC × 2"],
  },
  {
    slug: "physique-cut",
    title: "Physique Cut · 12 semaines",
    coachSlug: "amina-ouadah",
    category: "HYPERTROPHY",
    level: "ADVANCED",
    weeks: 12,
    sessionsPerWeek: 5,
    priceCents: 5900,
    priceIntervalLabel: "/mois",
    description:
      "Sèche structurée avec maintien de la masse. Ajustements macro hebdo, cardio progressif.",
    equipment: ["Salle complète"],
    outcomes: ["-5 à -8% BF", "Masse préservée", "Shape scène"],
  },
];

export function getCoach(slug: string) {
  return coaches.find((c) => c.slug === slug);
}

export function getProgram(slug: string) {
  return programs.find((p) => p.slug === slug);
}

export function getProgramsByCoach(coachSlug: string) {
  return programs.filter((p) => p.coachSlug === coachSlug);
}
