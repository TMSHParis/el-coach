// Généré par scripts/parse-content-library.ts depuis scripts/source-html/ecm-crossfit-wods.html.
// WODs Girls/Hero/Open absents de src/lib/wods.ts au moment de la génération.
// Les mouvements non reconnus (movementId "unmatched") sont à corriger manuellement
// avant intégration (voir le rapport affiché par le script).
import type { WodTemplate } from "./wods";

export const EXTENDED_WODS: WodTemplate[] = [
  {
    "slug": "eva",
    "name": "EVA",
    "category": "girls",
    "scheme": "5 rounds :800m Run · 30 KB Swings · 30 Pull-ups",
    "description": "WOD long Dimanche Full Body · semaine de décharge · cardio + pull — RX : ♂ 32kg KB · ♀ 24kg KB · Durée : 45-60min",
    "block": {
      "name": "EVA",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "run",
          "distance": "800m"
        },
        {
          "movementId": "kb-swing-american",
          "reps": 30
        },
        {
          "movementId": "kipping-pullup",
          "reps": 30
        }
      ]
    }
  },
  {
    "slug": "nicole",
    "name": "NICOLE",
    "category": "girls",
    "scheme": "Répéter le max de rounds :400m Run · Max Pull-ups unbroken",
    "description": "Vendredi Zone 2+ (état VERT) · benchmark Pull-ups + cardio — RX : BW · Noté : total Pull-ups",
    "block": {
      "name": "NICOLE",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "run"
        },
        {
          "movementId": "unrecognized-max-pull-ups-unbroken",
          "notes": "Max Pull-ups unbroken"
        }
      ]
    }
  },
  {
    "slug": "linda",
    "name": "LINDA",
    "category": "girls",
    "scheme": "10-9-8-7-6-5-4-3-2-1 reps :Bench Press (BW) · Clean (3/4 BW) · Deadlift (1.5 BW)",
    "description": "WOD Lundi Upper (Bench = horizontal) · combo force trimodalité — RX : Charges = % poids de corps · Durée : 30-45min",
    "block": {
      "name": "LINDA",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "bench-press"
        },
        {
          "movementId": "clean"
        },
        {
          "movementId": "deadlift"
        }
      ]
    }
  },
  {
    "slug": "amanda",
    "name": "AMANDA",
    "category": "girls",
    "scheme": "9-7-5 reps :Muscle-ups · Squat Snatches",
    "description": "WOD Dimanche HPS (rotation) · gymnastics + Olympic lift pur — RX : ♂ 61kg · ♀ 43kg · Scaled : Pull-ups + Power Snatch",
    "block": {
      "name": "AMANDA",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "bar-muscleup"
        },
        {
          "movementId": "power-snatch"
        }
      ]
    }
  },
  {
    "slug": "lynne",
    "name": "LYNNE",
    "category": "girls",
    "scheme": "5 rounds (pas de timer) :Bench Press max reps (BW) · Pull-ups max reps unbroken",
    "description": "Bloc Accessoire Lundi Upper · ou Benchmark mensuel force horizontale — RX : BW sur Bench Press · Noté : total reps",
    "block": {
      "name": "LYNNE",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "bench-press"
        },
        {
          "movementId": "kipping-pullup"
        }
      ]
    }
  },
  {
    "slug": "nasty-girls",
    "name": "NASTY GIRLS",
    "category": "girls",
    "scheme": "3 rounds :50 Air Squats · 7 Muscle-ups · 10 Hang Power Cleans",
    "description": "WOD Dimanche Full Body · gymnastics + Olympic + cardio — RX : ♂ 61kg · ♀ 43kg · Scaled : Pull-ups + Dips",
    "block": {
      "name": "NASTY GIRLS",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "air-squat",
          "reps": 50
        },
        {
          "movementId": "bar-muscleup",
          "reps": 7
        },
        {
          "movementId": "hang-power-clean",
          "reps": 10
        }
      ]
    }
  },
  {
    "slug": "the-seven",
    "name": "THE SEVEN",
    "category": "heroes",
    "scheme": "7 rounds :7 HSPU · 7 KB Swings · 7 Pull-ups · 7 Burpees · 7 KB Swings · 7 K2E · 7 Deadlifts",
    "description": "WOD long Dimanche · ou remplace séance complète semaine de volume — RX : KB 32kg · DL 102kg · Cap 35min",
    "block": {
      "name": "THE SEVEN",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "hspu",
          "reps": 7
        },
        {
          "movementId": "kb-swing-american",
          "reps": 7
        },
        {
          "movementId": "kipping-pullup",
          "reps": 7
        },
        {
          "movementId": "burpee",
          "reps": 7
        },
        {
          "movementId": "kb-swing-american",
          "reps": 7
        },
        {
          "movementId": "k2e",
          "reps": 7
        },
        {
          "movementId": "deadlift",
          "reps": 7
        }
      ]
    }
  },
  {
    "slug": "randy",
    "name": "RANDY",
    "category": "heroes",
    "scheme": "75 Power Snatches",
    "description": "Finisher Dimanche HPS · snatch de vitesse · ou Benchmark mensuel — RX : ♂ 34kg · ♀ 24kg · Viser sub-5min",
    "block": {
      "name": "RANDY",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "power-snatch"
        }
      ]
    }
  },
  {
    "slug": "jack",
    "name": "JACK",
    "category": "heroes",
    "scheme": "Répéter le max de rounds :10 Push Press · 10 KB Swings · 10 Box Jumps",
    "description": "WOD Lundi Upper ou Jeudi Lower · mix press + KB + saut — RX : ♂ Push Press 52kg · ♂ KB 32kg · Box 24\"",
    "block": {
      "name": "JACK",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "push-press"
        },
        {
          "movementId": "kb-swing-american",
          "reps": 10
        },
        {
          "movementId": "box-jump",
          "reps": 10
        }
      ]
    }
  },
  {
    "slug": "nate",
    "name": "NATE",
    "category": "heroes",
    "scheme": "Répéter le max de rounds :2 Muscle-ups · 4 HSPU · 8 KB Swings",
    "description": "WOD Lundi Upper · gymnastics + KB · transfert Boxe (épaules) — RX : ♂ 32kg · ♀ 24kg · Scaled : Pull-ups + Dips + KB Swings",
    "block": {
      "name": "NATE",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "bar-muscleup"
        },
        {
          "movementId": "hspu",
          "reps": 4
        },
        {
          "movementId": "kb-swing-american",
          "reps": 8
        }
      ]
    }
  },
  {
    "slug": "holleyman",
    "name": "HOLLEYMAN",
    "category": "heroes",
    "scheme": "30 rounds :5 Wall Balls · 3 HSPU · 1 Power Clean",
    "description": "WOD Dimanche Full Body · volume + force · 1×/mois max — RX : ♂ 102kg Clean · ♀ 70kg Clean · Durée : 30-45min",
    "block": {
      "name": "HOLLEYMAN",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "wall-ball",
          "reps": 5
        },
        {
          "movementId": "hspu",
          "reps": 3
        },
        {
          "movementId": "power-clean",
          "reps": 1
        }
      ]
    }
  },
  {
    "slug": "kalsu",
    "name": "KALSU",
    "category": "heroes",
    "scheme": "100 Thrusters · + 5 Burpees au début de chaque minute",
    "description": "WOD extrême · semaine de décharge · Full Body Dimanche 1×/6sem — RX : ♂ 61kg · ♀ 43kg · Durée : 20-45min",
    "block": {
      "name": "KALSU",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "thruster"
        },
        {
          "movementId": "burpee",
          "reps": 5
        }
      ]
    }
  },
  {
    "slug": "hansen",
    "name": "HANSEN",
    "category": "heroes",
    "scheme": "5 rounds :30 KB Swings · 30 Burpees · 30 GHD Sit-ups",
    "description": "Long WOD Dimanche Full Body · ou Jeudi Lower (KB Swings) — RX : ♂ 32kg · ♀ 24kg · Durée : 45-60min",
    "block": {
      "name": "HANSEN",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "kb-swing-american",
          "reps": 30
        },
        {
          "movementId": "burpee",
          "reps": 30
        },
        {
          "movementId": "ghd-situp",
          "reps": 30
        }
      ]
    }
  },
  {
    "slug": "loredo",
    "name": "LOREDO",
    "category": "heroes",
    "scheme": "6 rounds :24 Air Squats · 24 Push-ups · 24 Walking Lunges · 400m Run",
    "description": "WOD Jeudi Lower · ou Mardi Zone 2+ actif · volume bas du corps — RX : BW · Durée : 35-50min",
    "block": {
      "name": "LOREDO",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "air-squat",
          "reps": 24
        },
        {
          "movementId": "pushup",
          "reps": 24
        },
        {
          "movementId": "walking-lunge",
          "reps": 24
        },
        {
          "movementId": "run",
          "distance": "400m"
        }
      ]
    }
  },
  {
    "slug": "jason",
    "name": "JASON",
    "category": "heroes",
    "scheme": "100 Air Squats · 5 Muscle-ups · 75 Squats · 10 Muscle-ups · 50 Squats · 15 Muscle-ups · 25 Squats · 20 Muscle-ups",
    "description": "Dimanche Full Body · volume squats + gymnastics · endurance mentale — RX : BW · Scaled : Pull-ups + Dips",
    "block": {
      "name": "JASON",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "air-squat"
        },
        {
          "movementId": "bar-muscleup",
          "reps": 5
        },
        {
          "movementId": "air-squat",
          "reps": 75
        },
        {
          "movementId": "bar-muscleup",
          "reps": 10
        },
        {
          "movementId": "air-squat",
          "reps": 50
        },
        {
          "movementId": "bar-muscleup",
          "reps": 15
        },
        {
          "movementId": "air-squat",
          "reps": 25
        },
        {
          "movementId": "bar-muscleup",
          "reps": 20
        }
      ]
    }
  },
  {
    "slug": "josh",
    "name": "JOSH",
    "category": "heroes",
    "scheme": "21-15-9 reps :Overhead Squats · Pull-ups",
    "description": "WOD Jeudi Lower (OHS) + Pull-ups · mobilité + force — RX : ♂ 61kg · ♀ 43kg",
    "block": {
      "name": "JOSH",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "overhead-squat"
        },
        {
          "movementId": "kipping-pullup"
        }
      ]
    }
  },
  {
    "slug": "badger",
    "name": "BADGER",
    "category": "heroes",
    "scheme": "3 rounds :30 Squat Cleans · 30 Pull-ups · 800m Run",
    "description": "Long WOD Dimanche Power Clean · Olympic + Pull + Cardio — RX : ♂ 43kg · ♀ 29kg · Durée : 40-60min",
    "block": {
      "name": "BADGER",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "clean",
          "reps": 30
        },
        {
          "movementId": "kipping-pullup",
          "reps": 30
        },
        {
          "movementId": "run",
          "distance": "800m"
        }
      ]
    }
  },
  {
    "slug": "whitten",
    "name": "WHITTEN",
    "category": "heroes",
    "scheme": "5 rounds :22 KB Swings · 22 Box Jumps · 400m Run · 22 Burpees · 22 Wall Balls",
    "description": "WOD extrême Dimanche · 1×/6 semaines max · remplace tout — RX : ♂ 32kg KB · Box 24\" · Ball 9kg · Durée : 60-90min",
    "block": {
      "name": "WHITTEN",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "kb-swing-american",
          "reps": 22
        },
        {
          "movementId": "box-jump",
          "reps": 22
        },
        {
          "movementId": "run",
          "distance": "400m"
        },
        {
          "movementId": "burpee",
          "reps": 22
        },
        {
          "movementId": "wall-ball",
          "reps": 22
        }
      ]
    }
  },
  {
    "slug": "lumberjack-20",
    "name": "LUMBERJACK 20",
    "category": "heroes",
    "scheme": "20 reps de chaque :DL 102kg · KB Swings 32kg · OH Squats 43kg · HSPU · Box Jumps 24\" · DB Hang Squat Cleans 22.5kg · Burpees",
    "description": "WOD Dimanche Full Body · tout en un · benchmark trimestriel — RX : Chipper lourd · Durée : 30-45min",
    "block": {
      "name": "LUMBERJACK 20",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "deadlift"
        },
        {
          "movementId": "kb-swing-american"
        },
        {
          "movementId": "overhead-squat"
        },
        {
          "movementId": "hspu"
        },
        {
          "movementId": "box-jump"
        },
        {
          "movementId": "db-hang-clean"
        },
        {
          "movementId": "burpee"
        }
      ]
    }
  },
  {
    "slug": "griff",
    "name": "GRIFF",
    "category": "heroes",
    "scheme": "800m Run · 400m Run à reculons · 800m Run · 400m Run à reculons",
    "description": "Mardi Zone 2+ (cardio inhabituel) · renforce équilibre proprioception — RX : BW · Coordination + cardio",
    "block": {
      "name": "GRIFF",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "unrecognized-m-run",
          "notes": "m Run"
        },
        {
          "movementId": "run",
          "distance": "400m"
        },
        {
          "movementId": "run",
          "distance": "800m"
        },
        {
          "movementId": "run",
          "distance": "400m"
        }
      ]
    }
  },
  {
    "slug": "mcghee",
    "name": "McGHEE",
    "category": "heroes",
    "scheme": "Répéter le max de rounds :5 Deadlifts · 13 Push-ups · 9 Box Jumps",
    "description": "WOD Jeudi Lower · DL lourd + explosivité · 20-25min version ECM — RX : ♂ 155kg DL · Box 24\"",
    "block": {
      "name": "McGHEE",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "deadlift"
        },
        {
          "movementId": "pushup",
          "reps": 13
        },
        {
          "movementId": "box-jump",
          "reps": 9
        }
      ]
    }
  },
  {
    "slug": "erin",
    "name": "ERIN",
    "category": "heroes",
    "scheme": "5 rounds :15 DB Split Cleans · 21 Pull-ups",
    "description": "WOD Lundi Upper · DB split cleans = transfert direct Boxe coordination — RX : ♂ 22.5kg/main · ♀ 15kg/main",
    "block": {
      "name": "ERIN",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "db-hang-clean",
          "reps": 15
        },
        {
          "movementId": "kipping-pullup",
          "reps": 21
        }
      ]
    }
  },
  {
    "slug": "blake",
    "name": "BLAKE",
    "category": "heroes",
    "scheme": "4 rounds :100ft Shuttle Run · 16 KB Swings · 16 Box Jumps · 8 Muscle-ups",
    "description": "WOD Dimanche Full Body · cardio + KB + gymnastics — RX : ♂ 32kg KB · Box 24\" · Scaled : Pull-ups + Dips",
    "block": {
      "name": "BLAKE",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "shuttle-run",
          "distance": "100ft"
        },
        {
          "movementId": "kb-swing-american",
          "reps": 16
        },
        {
          "movementId": "box-jump",
          "reps": 16
        },
        {
          "movementId": "bar-muscleup",
          "reps": 8
        }
      ]
    }
  },
  {
    "slug": "11-1-14-1",
    "name": "11.1 / 14.1",
    "category": "open",
    "scheme": "30 Double Unders · 15 Power Snatches",
    "description": "Finisher Dimanche HPS · cardio + snatch · 10min parfait — RX : ♂ 35kg · ♀ 24kg · Scaled : Simple Unders ×3",
    "block": {
      "name": "11.1 / 14.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "double-under"
        },
        {
          "movementId": "power-snatch",
          "reps": 15
        }
      ]
    }
  },
  {
    "slug": "11-6-12-5-13-5-18-5",
    "name": "11.6 / 12.5 / 13.5 / 18.5",
    "category": "open",
    "scheme": "3-6-9-12... Thrusters + Chest-to-Bar Pull-ups(ajout de 3 reps à chaque tranche quand le 21 est complété)",
    "description": "Finisher Lundi Upper · ou Benchmark mensuel intensity · 7min max — RX : ♂ 43kg · ♀ 29kg · Scaled : Pull-ups classiques",
    "block": {
      "name": "11.6 / 12.5 / 13.5 / 18.5",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "thruster"
        },
        {
          "movementId": "c2b"
        }
      ]
    }
  },
  {
    "slug": "12-1",
    "name": "12.1",
    "category": "open",
    "scheme": "Burpees au maximum",
    "description": "Finisher simple · Mardi Zone 2+ · ou warm-up mental avant Boxe — RX : BW · Viser 90+ reps",
    "block": {
      "name": "12.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "burpee"
        }
      ]
    }
  },
  {
    "slug": "14-5-15-5",
    "name": "14.5 / 15.5",
    "category": "open",
    "scheme": "21-18-15-12-9-6-3 reps :Thrusters · Burpees (14.5) ou Row Calories (15.5)",
    "description": "WOD Dimanche Full Body ou Jeudi Lower · descente pyramidale — RX : ♂ 43kg · ♀ 29kg",
    "block": {
      "name": "14.5 / 15.5",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "thruster"
        },
        {
          "movementId": "burpee"
        }
      ]
    }
  },
  {
    "slug": "15-1",
    "name": "15.1",
    "category": "open",
    "scheme": "15 Toes to Bar · 10 DB Snatch · 5 Clean & Jerk",
    "description": "WOD Lundi Upper · core + snatch + barbell · mix parfait — RX : DB ♂ 22.5kg · C&J ♂ 61kg",
    "block": {
      "name": "15.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "t2b"
        },
        {
          "movementId": "db-snatch",
          "reps": 10
        },
        {
          "movementId": "clean-and-jerk",
          "reps": 5
        }
      ]
    }
  },
  {
    "slug": "16-1",
    "name": "16.1",
    "category": "open",
    "scheme": "25ft Walking Lunges · 8 Bar Muscle-ups · 25ft Walking Lunges · 8 Power Cleans",
    "description": "WOD Dimanche Power Clean · lunges + bar MU + clean · 20min — RX : ♂ 61kg Clean · Scaled : Pull-ups",
    "block": {
      "name": "16.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "walking-lunge"
        },
        {
          "movementId": "bar-muscleup",
          "reps": 8
        },
        {
          "movementId": "walking-lunge",
          "distance": "25ft"
        },
        {
          "movementId": "power-clean",
          "reps": 8
        }
      ]
    }
  },
  {
    "slug": "16-4",
    "name": "16.4",
    "category": "open",
    "scheme": "55 DL · 55 Cal Row · 55 Wall Balls · puis HSPU ladder",
    "description": "WOD Jeudi Lower · DL + row + WB · 13min cap · endurance — RX : ♂ 102kg DL · Ball 9kg",
    "block": {
      "name": "16.4",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "deadlift"
        },
        {
          "movementId": "row",
          "reps": 55
        },
        {
          "movementId": "wall-ball",
          "reps": 55
        },
        {
          "movementId": "hspu"
        }
      ]
    }
  },
  {
    "slug": "17-1",
    "name": "17.1",
    "category": "open",
    "scheme": "10 DB Snatch · 15 Box Jump Overs",
    "description": "WOD Dimanche HPS (variante DB) ou Jeudi Lower · snatch + sauts — RX : ♂ 22.5kg DB · Box 24\" · Alterner les bras chaque round",
    "block": {
      "name": "17.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "db-snatch"
        },
        {
          "movementId": "box-jump-over",
          "reps": 15
        }
      ]
    }
  },
  {
    "slug": "17-5",
    "name": "17.5",
    "category": "open",
    "scheme": "10 rounds :9 Thrusters · 35 Double Unders",
    "description": "WOD Lundi Upper · Thrusters + cardio · rythme constant 10 rounds — RX : ♂ 43kg · ♀ 29kg · Scaled : Simple Unders",
    "block": {
      "name": "17.5",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "thruster",
          "reps": 9
        },
        {
          "movementId": "double-under",
          "reps": 35
        }
      ]
    }
  },
  {
    "slug": "18-1",
    "name": "18.1",
    "category": "open",
    "scheme": "8 Toes to Bar · 10 DB Hang Clean & Jerk · 14 Cal Row",
    "description": "WOD Lundi Upper ou Dimanche · T2B + DB + row · core complet — RX : DB ♂ 22.5kg/main · Alterner C&J",
    "block": {
      "name": "18.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "t2b"
        },
        {
          "movementId": "db-hang-clean-oh",
          "reps": 10
        },
        {
          "movementId": "row",
          "reps": 14
        }
      ]
    }
  },
  {
    "slug": "18-4",
    "name": "18.4",
    "category": "open",
    "scheme": "21 DL · 21 HSPU · 15 DL · 15 HSPU · 9 DL · 9 HSPUpuis : 1-2-3-... DL + Strict HSPU",
    "description": "WOD Lundi Upper (HSPU Vertical) + chaîne post · combo Diane avancé — RX : ♂ 102kg DL · Strict HSPU",
    "block": {
      "name": "18.4",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "deadlift"
        },
        {
          "movementId": "hspu",
          "reps": 21
        },
        {
          "movementId": "deadlift",
          "reps": 15
        },
        {
          "movementId": "hspu",
          "reps": 15
        },
        {
          "movementId": "deadlift",
          "reps": 9
        },
        {
          "movementId": "hspu",
          "reps": 9
        },
        {
          "movementId": "strict-hspu"
        }
      ]
    }
  },
  {
    "slug": "19-1",
    "name": "19.1",
    "category": "open",
    "scheme": "19 Wall Balls · 19 Cal Row",
    "description": "Finisher Jeudi Lower · ou Mardi Zone 2+ (rythme soutenable) — RX : ♂ 9kg / cible 3m · Simple et brutal",
    "block": {
      "name": "19.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "wall-ball"
        },
        {
          "movementId": "row",
          "reps": 19
        }
      ]
    }
  },
  {
    "slug": "20-1",
    "name": "20.1",
    "category": "open",
    "scheme": "10 rounds :8 Ground-to-OH · 10 Bar-facing Burpees",
    "description": "WOD Dimanche Full Body · explosivité + cardio · 10min max — RX : ♂ 43kg · ♀ 29kg · G2OH = snatch ou C&J",
    "block": {
      "name": "20.1",
      "type": "wod",
      "format": "RFT",
      "exercises": [
        {
          "movementId": "g2oh",
          "reps": 8
        },
        {
          "movementId": "bar-facing-burpee",
          "reps": 10
        }
      ]
    }
  },
  {
    "slug": "21-1",
    "name": "21.1",
    "category": "open",
    "scheme": "1 Wall Walk · 10 DB Snatch · 1 Wall Walk · 50 DU2 Wall Walks · 10 DB Snatch · 2 Wall Walks · 50 DU · ...",
    "description": "WOD Lundi Upper · wall walks = gainage + épaules · format progressif — RX : DB ♂ 22.5kg · Scaled : Inchworms + SU",
    "block": {
      "name": "21.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "wall-walk"
        },
        {
          "movementId": "db-snatch",
          "reps": 10
        },
        {
          "movementId": "wall-walk",
          "reps": 1
        },
        {
          "movementId": "unrecognized-50-du2-wall-walks",
          "notes": "50 DU2 Wall Walks"
        },
        {
          "movementId": "db-snatch",
          "reps": 10
        },
        {
          "movementId": "wall-walk",
          "reps": 2
        },
        {
          "movementId": "double-under",
          "reps": 50
        },
        {
          "movementId": "unrecognized-",
          "notes": "..."
        }
      ]
    }
  },
  {
    "slug": "22-1",
    "name": "22.1",
    "category": "open",
    "scheme": "3 Wall Walks · 12 DB Snatch · 15 Box Jump Overs",
    "description": "WOD Dimanche Full Body · mélange gymnastic + snatch + saut — RX : DB ♂ 22.5kg · Box 24\" · Scaled : Inchworms",
    "block": {
      "name": "22.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "wall-walk"
        },
        {
          "movementId": "db-snatch",
          "reps": 12
        },
        {
          "movementId": "box-jump-over",
          "reps": 15
        }
      ]
    }
  },
  {
    "slug": "23-1",
    "name": "23.1",
    "category": "open",
    "scheme": "60 Cal Row · 50 Toes to Bar · 40 Wall Balls · 30 Cleans · 20 Muscle-ups",
    "description": "WOD Dimanche Full Body · chipper Open · 14min cap strict — RX : ♂ 61kg Clean · Ball 9kg · Scaled : K2E + Pull-ups",
    "block": {
      "name": "23.1",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "row"
        },
        {
          "movementId": "t2b",
          "reps": 50
        },
        {
          "movementId": "wall-ball",
          "reps": 40
        },
        {
          "movementId": "clean",
          "reps": 30
        },
        {
          "movementId": "bar-muscleup",
          "reps": 20
        }
      ]
    }
  },
  {
    "slug": "23-2",
    "name": "23.2",
    "category": "open",
    "scheme": "5 rounds × AMRAP 4min (1min repos) :Squat Clean ladder : 1 rep · 2 reps · 3 reps... poids augmente",
    "description": "WOD Dimanche Power Clean · format force-endurance original — RX : Débute 61kg · monte chaque round",
    "block": {
      "name": "23.2",
      "type": "wod",
      "format": "AMRAP",
      "exercises": [
        {
          "movementId": "unrecognized-amrap-4min-1min-repos-squat-clean-ladder-1-rep",
          "notes": "× AMRAP 4min (1min repos) :Squat Clean ladder : 1 rep"
        },
        {
          "movementId": "unrecognized-2-reps",
          "notes": "2 reps"
        },
        {
          "movementId": "unrecognized-3-reps-poids-augmente",
          "notes": "3 reps... poids augmente"
        }
      ]
    }
  },
  {
    "slug": "23-3",
    "name": "23.3",
    "category": "open",
    "scheme": "200 DU · 1 Squat Snatch 61kg · 200 DU · 2 Snatch · 200 DU · 3 Snatchpuis : 100 Burpee Pull-ups",
    "description": "WOD Dimanche HPS · DU + snatch lourd + burpees · format rare — RX : ♂ 61kg Snatch · Scaled : Single Unders + Power Snatch",
    "block": {
      "name": "23.3",
      "type": "wod",
      "format": "ForTime",
      "exercises": [
        {
          "movementId": "double-under"
        },
        {
          "movementId": "air-squat",
          "reps": 1
        },
        {
          "movementId": "double-under",
          "reps": 200
        },
        {
          "movementId": "power-snatch",
          "reps": 2
        },
        {
          "movementId": "double-under",
          "reps": 200
        },
        {
          "movementId": "unrecognized-3-snatchpuis-100-burpee-pull-ups",
          "notes": "3 Snatchpuis : 100 Burpee Pull-ups"
        }
      ]
    }
  }
];
