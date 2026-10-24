// Contenu des programmes (résumés, thèmes, focus, notes de bloc et d'exercice, fiches /training).
// Les données sources restent en français dans programs-v2.ts / program-content.ts : ce module ne sert
// qu'à l'AFFICHAGE. `tc(lang, texte)` renvoie la traduction si elle existe, sinon le texte d'origine.
// Module neutre (client et serveur). Ne jamais traduire une valeur de logique, de clé ou stockée en base.
//
// Jamais traduits : noms de mouvements (Back Squat…), de programmes, de formats (For Time, AMRAP, EMOM,
// Tabata, Build to Heavy, Warm Up, Metcon, Finisher…).
import type { Lang } from "./lang";

type Tr = readonly [string, string];

export const CONTENT: Record<string, Tr> = {
  // --- Résumés de programme ---
  "Squat, tirage, press. Arraché, épaulé. Muscle-up, handstand. Metcons qui brûlent. Une programmation conjuguée. Rien n'est laissé au hasard.": [
    "Squat, pull, press. Snatch, clean. Muscle-up, handstand. Metcons that burn. Fully integrated programming. Nothing is left to chance.",
    "Sentadilla, tirón, press. Arrancada, cargada. Muscle-up, handstand. Metcons que queman. Una programación conjugada. Nada se deja al azar.",
  ],
  "Trois piliers : hypertrophie, force, endurance (course à pied ou n'importe quel engine).": [
    "Three pillars: hypertrophy, strength, endurance (running or any engine).",
    "Tres pilares: hipertrofia, fuerza, resistencia (carrera a pie o cualquier engine).",
  ],
  "Stations, course, compétition. Une seule séance de seuil par semaine, la Zone 2 forme la base.": [
    "Stations, running, competition. Just one threshold session a week; Zone 2 is the base.",
    "Estaciones, carrera, competición. Una sola sesión de umbral por semana; la Zona 2 es la base.",
  ],
  "Split Upper / Lower / Push / Pull / Legs. Tout en Not For Time : seuls les repos entre séries sont décomptés.": [
    "Upper / Lower / Push / Pull / Legs split. All Not For Time: only the rest between sets is timed.",
    "Split Upper / Lower / Push / Pull / Legs. Todo en Not For Time: solo se cuenta el descanso entre series.",
  ],
  "Calisthénie intégrée, trois niveaux de matériel : Aucun, Basique, Étendu.": [
    "Built-in calisthenics, three equipment levels: None, Basic, Extended.",
    "Calistenia integrada, tres niveles de material: Ninguno, Básico, Ampliado.",
  ],

  // --- Thèmes de semaine ---
  "S1 volume · S2 +1 série sur B2 · S3 intensité · S4 décharge (≈60 %)": [
    "W1 volume · W2 +1 set on B2 · W3 intensity · W4 deload (≈60%)",
    "S1 volumen · S2 +1 serie en B2 · S3 intensidad · S4 descarga (≈60 %)",
  ],
  "Cycle de 4 semaines · S4 décharge (≈60-70 % du volume, cardio inchangé en intensité mais plus court)": [
    "4-week cycle · W4 deload (≈60-70% of volume, cardio same intensity but shorter)",
    "Ciclo de 4 semanas · S4 descarga (≈60-70 % del volumen, cardio con la misma intensidad pero más corto)",
  ],
  "S1-S2 progression · S3 pic · S4 décharge": [
    "W1-W2 progression · W3 peak · W4 deload",
    "S1-S2 progresión · S3 pico · S4 descarga",
  ],
  "Filière Hypertrophie par défaut · cible ≈ 12 à 16 séries par groupe et par semaine (à recompter par un coach)": [
    "Hypertrophy track by default · target ≈ 12 to 16 sets per muscle group per week (to be recounted by a coach)",
    "Vía Hipertrofia por defecto · objetivo ≈ 12 a 16 series por grupo y por semana (a recontar por un coach)",
  ],
  "Pas de thème : Équilibré · S4 décharge, pas de montée de niveau": [
    "No theme: Balanced · W4 deload, no level-up",
    "Sin tema: Equilibrado · S4 descarga, sin subida de nivel",
  ],

  // --- Focus des jours ---
  "Squat + cardio": ["Squat + cardio", "Sentadilla + cardio"],
  "Gymnastique + force haut modérée + core": ["Gymnastics + moderate upper strength + core", "Gimnasia + fuerza de tren superior moderada + core"],
  "Récupération active (facultatif)": ["Active recovery (optional)", "Recuperación activa (opcional)"],
  "Olympique + cardio": ["Olympic lifting + cardio", "Olímpico + cardio"],
  "Hinge (option modérée ou lourde)": ["Hinge (moderate or heavy option)", "Hinge (opción moderada o pesada)"],
  "WOD long / Hero": ["Long WOD / Hero", "WOD largo / Hero"],
  "Repos": ["Rest", "Descanso"],
  "Upper Force": ["Upper Strength", "Fuerza Upper"],
  "Lower Force": ["Lower Strength", "Fuerza Lower"],
  "Adaptatif Zone 2": ["Adaptive Zone 2", "Zona 2 adaptativa"],
  "Full Body Functional": ["Full Body Functional", "Full Body Functional"],
  "Hypertrophie Push/Pull": ["Push/Pull Hypertrophy", "Hipertrofia Push/Pull"],
  "WOD long (ou sport secondaire)": ["Long WOD (or secondary sport)", "WOD largo (o deporte secundario)"],
  "Force haut du corps": ["Upper body strength", "Fuerza de tren superior"],
  "Intervalles course compromise": ["Compromised running intervals", "Intervalos de carrera comprometida"],
  "Stations en travail": ["Station work", "Trabajo de estaciones"],
  "Force jambes": ["Leg strength", "Fuerza de piernas"],
  "Zone 2 longue": ["Long Zone 2", "Zona 2 larga"],
  "Simulation half": ["Half simulation", "Simulación half"],
  "Upper": ["Upper", "Upper"],
  "Lower": ["Lower", "Lower"],
  "Push": ["Push", "Push"],
  "Pull": ["Pull", "Pull"],
  "Legs": ["Legs", "Legs"],
  "Week-end libre": ["Free weekend", "Fin de semana libre"],
  "Full Body Force A": ["Full Body Strength A", "Full Body Fuerza A"],
  "Cardio poids du corps": ["Bodyweight cardio", "Cardio con peso corporal"],
  "Core & Skills": ["Core & Skills", "Core & Skills"],
  "Full Body Force B": ["Full Body Strength B", "Full Body Fuerza B"],
  "Run ou récupération active": ["Run or active recovery", "Carrera o recuperación activa"],

  // --- Notes de jour ---
  "Facultatif, non comptée comme manquée. Version complète (30-40 min) ou minimale (≈25 min : mobilité + cardio facile). Recommandée en état jaune ou rouge ; en décharge, version minimale seulement.": [
    "Optional, not counted as missed. Full version (30-40 min) or minimal (≈25 min: mobility + easy cardio). Recommended in yellow or red state; in deload, minimal version only.",
    "Opcional, no cuenta como falta. Versión completa (30-40 min) o mínima (≈25 min: movilidad + cardio fácil). Recomendada en estado amarillo o rojo; en descarga, solo la versión mínima.",
  ],
  "Option modérée par défaut. Option lourde (état vert seulement, avertissement : la veille est le jeudi, jour de squat avant ; non proposée en décharge) : Deadlift 5 × 3 Build to Heavy ; B3 AMRAP 12 allégé : 8 Pull-Ups, 10 KB Swings, 12 Goblet Squats. B4 au choix : core (Tabata) ou Renforcement facultatif (DB Bench, rows, curls, triceps, face pulls).": [
    "Moderate option by default. Heavy option (green state only; warning: the day before is Thursday, front squat day; not offered in deload): Deadlift 5 × 3 Build to Heavy; lighter B3 AMRAP 12: 8 Pull-Ups, 10 KB Swings, 12 Goblet Squats. B4 your choice: core (Tabata) or optional Strengthening (DB Bench, rows, curls, triceps, face pulls).",
    "Opción moderada por defecto. Opción pesada (solo en estado verde; aviso: el día anterior es jueves, día de sentadilla frontal; no se ofrece en descarga): Deadlift 5 × 3 Build to Heavy; B3 AMRAP 12 aligerado: 8 Pull-Ups, 10 KB Swings, 12 Goblet Squats. B4 a elegir: core (Tabata) o Refuerzo opcional (DB Bench, rows, curls, tríceps, face pulls).",
  ],
  "Toutes les 2 semaines (S2 et S4), le WOD du Bloc 3 est remplacé par un effort continu : 5 km de course ou 5 000 m de rameur, effort modéré (à confirmer).": [
    "Every 2 weeks (W2 and W4), the Block 3 WOD is replaced by a continuous effort: 5 km run or 5,000 m row, moderate effort (to be confirmed).",
    "Cada 2 semanas (S2 y S4), el WOD del Bloque 3 se sustituye por un esfuerzo continuo: 5 km de carrera o 5 000 m de remo, esfuerzo moderado (por confirmar).",
  ],
  "OFF · marche facile en option.": ["OFF · easy walk optional.", "OFF · caminata fácil opcional."],
  "Pas facultatif. Vert : Zone 2 de 40-45 min (course, vélo ou rameur au choix) + 10 min de mobilité. Jaune : 30 min + mobilité. Rouge : 20 min de mobilité / récupération active. Zone 2 : effort où l'on peut encore parler en phrases courtes (indicatif).": [
    "Not optional. Green: 40-45 min Zone 2 (run, bike or row, your choice) + 10 min mobility. Yellow: 30 min + mobility. Red: 20 min mobility / active recovery. Zone 2: an effort where you can still speak in short sentences (indicative).",
    "No es opcional. Verde: Zona 2 de 40-45 min (carrera, bici o remo a elegir) + 10 min de movilidad. Amarillo: 30 min + movilidad. Rojo: 20 min de movilidad / recuperación activa. Zona 2: esfuerzo en el que aún puedes hablar con frases cortas (orientativo).",
  ],
  "Option A : WOD long. Option B : sport secondaire déclaré dans le profil, aucun contenu imposé. Sortie longue facultative (course ou engine) : séance facultative.": [
    "Option A: long WOD. Option B: secondary sport declared in your profile, no imposed content. Optional long outing (run or engine): optional session.",
    "Opción A: WOD largo. Opción B: deporte secundario declarado en el perfil, sin contenido impuesto. Salida larga opcional (carrera o engine): sesión opcional.",
  ],
  "Seule séance de seuil de la semaine. Saisie : temps du km et de la station.": [
    "The only threshold session of the week. Log: km time and station time.",
    "Única sesión de umbral de la semana. Registro: tiempo del km y de la estación.",
  ],
  "Half : 4 × (1 km de course + une station), priorité aux stations de jambes. Full : 8 × (1 km + station) dans l'ordre officiel, réservé à l'état vert. Jaune : half. Rouge : récupération active. Un résultat par segment, total additionné.": [
    "Half: 4 × (1 km run + one station), leg stations first. Full: 8 × (1 km + station) in official order, green state only. Yellow: half. Red: active recovery. One result per segment, total added up.",
    "Half: 4 × (1 km de carrera + una estación), prioridad a las estaciones de piernas. Full: 8 × (1 km + estación) en el orden oficial, solo en estado verde. Amarillo: half. Rojo: recuperación activa. Un resultado por segmento, total sumado.",
  ],
  "Week-end libre : repos, ou le sport de ton choix.": ["Free weekend: rest, or the sport of your choice.", "Fin de semana libre: descanso, o el deporte que elijas."],
  "Même intensité que le vendredi, mouvements variés.": ["Same intensity as Friday, varied movements.", "Misma intensidad que el viernes, movimientos variados."],
  "Même intensité que le mardi, mouvements en rotation.": ["Same intensity as Tuesday, rotating movements.", "Misma intensidad que el martes, movimientos en rotación."],
  "Vert : footing continu 30-40 min facile. Jaune : 20-25 min. Rouge : marche + mobilité.": [
    "Green: easy continuous jog 30-40 min. Yellow: 20-25 min. Red: walk + mobility.",
    "Verde: footing continuo fácil de 30-40 min. Amarillo: 20-25 min. Rojo: caminata + movilidad.",
  ],

  // --- Noms de blocs (en français uniquement) ---
  "Retour au calme": ["Cool Down", "Vuelta a la calma"],
  "Gymnastique + force haut": ["Gymnastics + upper strength", "Gimnasia + fuerza de tren superior"],
  "Finisher core": ["Core Finisher", "Finisher de core"],
  "Cardio facile continu": ["Easy continuous cardio", "Cardio fácil continuo"],
  "Technique légère": ["Light technique", "Técnica ligera"],
  "Metcon 21-15-9": ["Metcon 21-15-9", "Metcon 21-15-9"],
  "Skill léger": ["Light Skill", "Skill ligero"],
  "WOD long": ["Long WOD", "WOD largo"],
  "Accessoires": ["Accessories", "Accesorios"],
  "Superset principal": ["Main Superset", "Superset principal"],
  "Superset épaules": ["Shoulder Superset", "Superset de hombros"],
  "Course compromise": ["Compromised running", "Carrera comprometida"],
  "Accessoire": ["Accessory", "Accesorio"],
  "Accessoire 1": ["Accessory 1", "Accesorio 1"],
  "Accessoire 2": ["Accessory 2", "Accesorio 2"],
  "Simulation half-Hyrox": ["Half-Hyrox Simulation", "Simulación half-Hyrox"],
  "Poussée + jambes": ["Push + legs", "Empuje + piernas"],
  "Tirage": ["Pull", "Tirón"],
  "Tirage + jambes": ["Pull + legs", "Tirón + piernas"],
  "Intervalles 40/20": ["40/20 Intervals", "Intervalos 40/20"],
  "Gainage": ["Core stability", "Core estático"],
  "Footing facile": ["Easy jog", "Footing fácil"],

  // --- Notes de bloc ---
  "Supprimé si état jaune, semaine de décharge ou thème Force.": [
    "Removed in yellow state, deload week or Strength theme.",
    "Se suprime en estado amarillo, semana de descarga o tema Fuerza.",
  ],
  "Facultatif : toujours proposé, jamais obligatoire.": ["Optional: always offered, never mandatory.", "Opcional: siempre propuesto, nunca obligatorio."],
  "Supprimé si état jaune.": ["Removed in yellow state.", "Se suprime en estado amarillo."],
  "Mobilité.": ["Mobility.", "Movilidad."],
  "Drills à la barre vide.": ["Drills with the empty bar.", "Drills con la barra vacía."],
  "EMOM 10 : 2 Power Cleans + 1 Front Squat (ou Power Snatch).": [
    "EMOM 10: 2 Power Cleans + 1 Front Squat (or Power Snatch).",
    "EMOM 10: 2 Power Cleans + 1 Front Squat (o Power Snatch).",
  ],
  "Supprimé si état jaune ou temps court.": ["Removed in yellow state or short on time.", "Se suprime en estado amarillo o con poco tiempo."],
  "Tabata 8 × 20 s / 10 s en alternant Hollow Hold et Sit-Ups.": [
    "Tabata 8 × 20 s / 10 s alternating Hollow Hold and Sit-Ups.",
    "Tabata 8 × 20 s / 10 s alternando Hollow Hold y Sit-Ups.",
  ],
  "Mobilité complète + activation générale.": ["Full mobility + general activation.", "Movilidad completa + activación general."],
  "Supprimé si état jaune ou thème Force (protège le squat du mardi).": [
    "Removed in yellow state or Strength theme (protects Tuesday's squat).",
    "Se suprime en estado amarillo o tema Fuerza (protege la sentadilla del martes).",
  ],
  "3 séries proches de l'échec.": ["3 sets close to failure.", "3 series cerca del fallo."],
  "Facultatif, supprimé si état jaune.": ["Optional, removed in yellow state.", "Opcional, se suprime en estado amarillo."],
  "2 min de repos entre tours.": ["2 min rest between rounds.", "2 min de descanso entre rondas."],
  "Allure confortable, sans chrono compétitif. Repos libre entre blocs. Technique et capacité, pas la vitesse.": [
    "Comfortable pace, no competitive timing. Free rest between blocks. Technique and capacity, not speed.",
    "Ritmo cómodo, sin cronómetro de competición. Descanso libre entre bloques. Técnica y capacidad, no velocidad.",
  ],
  "Facultatif.": ["Optional.", "Opcional."],
  "Mobilité bassin et dos.": ["Hip and back mobility.", "Movilidad de cadera y espalda."],
  "5 tours de 40 s d'effort / 20 s de repos sur 4 mouvements, 90 s de repos entre tours.": [
    "5 rounds of 40 s work / 20 s rest across 4 movements, 90 s rest between rounds.",
    "5 rondas de 40 s de esfuerzo / 20 s de descanso con 4 movimientos, 90 s de descanso entre rondas.",
  ],
  "5 tours de 40 s d'effort / 20 s de repos, 90 s de repos entre tours.": [
    "5 rounds of 40 s work / 20 s rest, 90 s rest between rounds.",
    "5 rondas de 40 s de esfuerzo / 20 s de descanso, 90 s de descanso entre rondas.",
  ],

  // --- Notes d'exercice ---
  "2 tours : 200 m de course ou 250 m de rameur.": ["2 rounds: 200 m run or 250 m row.", "2 rondas: 200 m de carrera o 250 m de remo."],
  "Pause 3 s en bas.": ["3 s pause at the bottom.", "Pausa de 3 s abajo."],
  "Ou Step-Ups.": ["Or Step-Ups.", "O Step-Ups."],
  "Ou 60 Single-Unders.": ["Or 60 Single-Unders.", "O 60 Single-Unders."],
  "Étirements quadriceps, fessiers, mollets.": ["Stretch quads, glutes, calves.", "Estiramientos de cuádriceps, glúteos y gemelos."],
  "Ou Pike Hold.": ["Or Pike Hold.", "O Pike Hold."],
  "Ou Chest-to-Bar.": ["Or Chest-to-Bar.", "O Chest-to-Bar."],
  "Charge modérée, jamais au maximum. Facultatif : tu peux le passer.": [
    "Moderate load, never maximal. Optional: you can skip it.",
    "Carga moderada, nunca al máximo. Opcional: puedes saltarlo.",
  ],
  "Minute 1.": ["Minute 1.", "Minuto 1."],
  "Minute 2.": ["Minute 2.", "Minuto 2."],
  "Minute 3.": ["Minute 3.", "Minuto 3."],
  "Zone 1-2 : rameur, vélo ou footing. Saisie durée, distance, allure.": [
    "Zone 1-2: rower, bike or jog. Log time, distance, pace.",
    "Zona 1-2: remo, bici o footing. Registro de duración, distancia y ritmo.",
  ],
  "Technique, sans charge ni chrono.": ["Technique, no load and no timer.", "Técnica, sin carga ni cronómetro."],
  "Très faciles.": ["Very easy.", "Muy fáciles."],
  "Charges modérées à lourdes, jamais à l'échec.": ["Moderate to heavy loads, never to failure.", "Cargas moderadas a pesadas, nunca al fallo."],
  "Calories maximum.": ["Max calories.", "Máximo de calorías."],
  "Charge confortable.": ["Comfortable load.", "Carga cómoda."],
  "Au choix : Double-Unders, transition Muscle-Up ou Rope Climb.": [
    "Your choice: Double-Unders, Muscle-Up transition or Rope Climb.",
    "A elegir: Double-Unders, transición de Muscle-Up o Rope Climb.",
  ],
  "Facile, Zone 1.": ["Easy, Zone 1.", "Fácil, Zona 1."],
  "Facile.": ["Easy.", "Fácil."],
  "Ou Strict Press.": ["Or Strict Press.", "O Strict Press."],
  "Ou Lat Pulldown.": ["Or Lat Pulldown.", "O Lat Pulldown."],
  "Allure soutenue, volume modéré, jamais maximal.": ["Sustained pace, moderate volume, never maximal.", "Ritmo sostenido, volumen moderado, nunca máximo."],
  "10 cal, repos le reste de la minute.": ["10 cal, rest for the remainder of the minute.", "10 cal, descanso el resto del minuto."],
  "Course, vélo ou rameur. Saisie durée, distance, allure.": [
    "Run, bike or row. Log time, distance, pace.",
    "Carrera, bici o remo. Registro de duración, distancia y ritmo.",
  ],
  "Lents.": ["Slow.", "Lentos."],
  "Ou engine.": ["Or engine.", "O engine."],
  "Tirage à charge modérée, jamais à l'échec (Deadlift la veille).": [
    "Pull at moderate load, never to failure (Deadlift the day before).",
    "Tirón con carga moderada, nunca al fallo (Deadlift el día anterior).",
  ],
  "Un bras.": ["One arm.", "Un brazo."],
  "Footing progressif.": ["Progressive jog.", "Footing progresivo."],
  "Éducatifs de course.": ["Running drills.", "Ejercicios técnicos de carrera."],
  "Allure cible, 5 à 6 tours.": ["Target pace, 5 to 6 rounds.", "Ritmo objetivo, 5 a 6 rondas."],
  "Station courte au choix : 20 Wall Balls, 25 m Sled Push ou 250 m rameur. Enchaînée sans pause.": [
    "Short station of your choice: 20 Wall Balls, 25 m Sled Push or 250 m row. Done straight after, no break.",
    "Estación corta a elegir: 20 Wall Balls, 25 m Sled Push o 250 m de remo. Encadenada sin pausa.",
  ],
  "Par côté.": ["Each side.", "Por lado."],
  "Très facile.": ["Very easy.", "Muy fácil."],
  "Course, vélo ou rameur. Saisie durée, distance, allure moyenne.": [
    "Run, bike or row. Log time, distance, average pace.",
    "Carrera, bici o remo. Registro de duración, distancia y ritmo medio.",
  ],
  "Cardio léger.": ["Light cardio.", "Cardio ligero."],
  "2 séries d'approche.": ["2 warm-up sets.", "2 series de aproximación."],
  "Superset avec Lateral Raises.": ["Superset with Lateral Raises.", "Superset con Lateral Raises."],
  "Machine ou haltères.": ["Machine or dumbbells.", "Máquina o mancuernas."],
  "Seated Row.": ["Seated Row.", "Seated Row."],
  "Arrière d'épaule (≈ 3 séries par semaine ; un 2e mouvement si priorité Esthétique).": [
    "Rear delts (≈ 3 sets per week; a 2nd movement if Aesthetics is the priority).",
    "Deltoides posterior (≈ 3 series por semana; un 2.º movimiento si la prioridad es Estética).",
  ],
  "Ou Hack Squat.": ["Or Hack Squat.", "O Hack Squat."],
  "Par jambe.": ["Each leg.", "Por pierna."],
  "Chaîne : genoux → pompes → déclinées → archer → une main.": [
    "Chain: knees → push-ups → decline → archer → one arm.",
    "Cadena: rodillas → flexiones → declinadas → arquero → una mano.",
  ],
  "Chaîne : squat → bulgare → pistol assisté → pistol.": [
    "Chain: squat → Bulgarian → assisted pistol → pistol.",
    "Cadena: sentadilla → búlgara → pistol asistida → pistol.",
  ],
  "Élastique ou sac si pas de barre.": ["Band or bag if no bar.", "Banda elástica o mochila si no hay barra."],
  "Poirier contre le mur.": ["Handstand against the wall.", "Parada de manos contra la pared."],
  "Chaîne : rowing renversé → tractions négatives → tractions → lestées → archer.": [
    "Chain: inverted row → negative pull-ups → pull-ups → weighted → archer.",
    "Cadena: remo invertido → dominadas negativas → dominadas → lastradas → arquero.",
  ],
  "Ou glute bridge une jambe.": ["Or single-leg glute bridge.", "O glute bridge a una pierna."],
  "Facile. Saisie distance, temps, allure.": ["Easy. Log distance, time, pace.", "Fácil. Registro de distancia, tiempo y ritmo."],

  // --- Charges, répétitions, repos (textes libres) ---
  "bâton": ["PVC pipe", "bastón"],
  "barre vide": ["empty bar", "barra vacía"],
  "KB léger": ["light KB", "KB ligera"],
  "séries d'approche": ["warm-up sets", "series de aproximación"],
  "lesté": ["weighted", "con lastre"],
  "lourd": ["heavy", "pesado"],
  "charge d'entraînement": ["training load", "carga de entrenamiento"],
  "séries courtes": ["short sets", "series cortas"],
  "proche de l'échec": ["close to failure", "cerca del fallo"],
  "libre": ["free", "libre"],

  // --- Fiches /training/[slug] (program-content.ts) ---
  "Une programmation conjuguée. Rien n'est laissé au hasard.": ["Fully integrated programming. Nothing is left to chance.", "Una programación conjugada. Nada se deja al azar."],
  "Mobilité, activation cardio, mouvements spécifiques à la séance.": ["Mobility, cardio activation, session-specific movements.", "Movilidad, activación cardio, movimientos específicos de la sesión."],
  "Mouvement technique ou levé lourd. Snatch, muscle-up, squat lourd...": ["Technical movement or heavy lift. Snatch, muscle-up, heavy squat...", "Movimiento técnico o levantamiento pesado. Snatch, muscle-up, sentadilla pesada..."],
  "Effort intense. Format variable selon le jour.": ["Intense effort. Format varies by day.", "Esfuerzo intenso. Formato variable según el día."],
  "Lun=Cardio · Mar=Core · Mer=Renfo · Jeu=Cardio · Ven=Core · Sam=WOD long": ["Mon=Cardio · Tue=Core · Wed=Strengthening · Thu=Cardio · Fri=Core · Sat=Long WOD", "Lun=Cardio · Mar=Core · Mié=Refuerzo · Jue=Cardio · Vie=Core · Sáb=WOD largo"],
  "Étirements, mobilité, récupération active.": ["Stretching, mobility, active recovery.", "Estiramientos, movilidad, recuperación activa."],
  "Séance complète · Charges prescrites · Intensité 100%": ["Full session · Prescribed loads · 100% intensity", "Sesión completa · Cargas prescritas · Intensidad 100%"],
  "Volume réduit · Intensité 80% · Finisher allégé": ["Reduced volume · 80% intensity · Lighter Finisher", "Volumen reducido · Intensidad 80% · Finisher aligerado"],
  "Warm Up + Mobilité uniquement · Pas de WOD": ["Warm Up + Mobility only · No WOD", "Solo Warm Up + Movilidad · Sin WOD"],
  "Commencer avec CrossFit Pure →": ["Start with CrossFit Pure →", "Empezar con CrossFit Pure →"],
  "Functional Training · Force & Cardio": ["Functional Training · Strength & Cardio", "Functional Training · Fuerza y Cardio"],
  "Programme hybride combinant force fonctionnelle, kettlebell, mouvements composés et cardio ciblé. Conçu pour développer un athlète complet — fort, endurant et mobile.": [
    "Hybrid program combining functional strength, kettlebell, compound movements and targeted cardio. Built to develop a complete athlete: strong, enduring and mobile.",
    "Programa híbrido que combina fuerza funcional, kettlebell, movimientos compuestos y cardio específico. Diseñado para formar un atleta completo: fuerte, resistente y móvil.",
  ],
  "Mouvement de force fonctionnelle ou kettlebell — build to heavy ou séries chargées.": ["Functional strength or kettlebell movement: build to heavy or loaded sets.", "Movimiento de fuerza funcional o kettlebell: build to heavy o series con carga."],
  "Conditioning combinant force et cardio.": ["Conditioning combining strength and cardio.", "Conditioning que combina fuerza y cardio."],
  "Cardio ou core selon le jour.": ["Cardio or core depending on the day.", "Cardio o core según el día."],
  "Upper Body Force (poussée / traction lourde)": ["Upper Body Strength (heavy push / pull)", "Upper Body Fuerza (empuje / tirón pesado)"],
  "Lower Body Force (squat / hip hinge lourd)": ["Lower Body Strength (heavy squat / hip hinge)", "Lower Body Fuerza (sentadilla / hip hinge pesado)"],
  "Full Body Functional (KB · DB · BW)": ["Full Body Functional (KB · DB · BW)", "Full Body Functional (KB · DB · BW)"],
  "Jour Adaptatif (selon check-in)": ["Adaptive Day (based on check-in)", "Día adaptativo (según el check-in)"],
  "Push / Pull Hypertrophie (volume 8-12 reps)": ["Push / Pull Hypertrophy (8-12 reps volume)", "Push / Pull Hipertrofia (volumen 8-12 reps)"],
  "WOD Long ou sport secondaire du cycle": ["Long WOD or secondary sport of the cycle", "WOD largo o deporte secundario del ciclo"],
  "Repos ou récupération active": ["Rest or active recovery", "Descanso o recuperación activa"],
  "Commencer avec Hybrid Engine →": ["Start with Hybrid Engine →", "Empezar con Hybrid Engine →"],
  "Six jours par semaine. Chaque séance te rapproche de la ligne de départ.": ["Six days a week. Every session brings you closer to the start line.", "Seis días por semana. Cada sesión te acerca a la línea de salida."],
  "Activation cardio, mobilité articulaire, mouvements spécifiques Hyrox.": ["Cardio activation, joint mobility, Hyrox-specific movements.", "Activación cardio, movilidad articular, movimientos específicos de Hyrox."],
  "Jambes ou haut du corps selon le jour.": ["Legs or upper body depending on the day.", "Piernas o tren superior según el día."],
  "Compromised running, stations, simulation half ou full.": ["Compromised running, stations, half or full simulation.", "Compromised running, estaciones, simulación half o full."],
  "Travail complémentaire selon les faiblesses du jour.": ["Complementary work based on the day's weaknesses.", "Trabajo complementario según las debilidades del día."],
  "Mobilité, récupération active.": ["Mobility, active recovery.", "Movilidad, recuperación activa."],
  "Intervalles compromised running": ["Compromised running intervals", "Intervalos de compromised running"],
  "Simulation stations": ["Stations simulation", "Simulación de estaciones"],
  "Simulation half ou full": ["Half or full simulation", "Simulación half o full"],
  "Séance complète · Simulation au pace compétition": ["Full session · Simulation at race pace", "Sesión completa · Simulación a ritmo de competición"],
  "Volume réduit · Pas de simulation · Force uniquement": ["Reduced volume · No simulation · Strength only", "Volumen reducido · Sin simulación · Solo fuerza"],
  "Zone 2 douce · Mobilité · Pas de compromised running": ["Easy Zone 2 · Mobility · No compromised running", "Zona 2 suave · Movilidad · Sin compromised running"],
  "Commencer avec Hyrox Pure →": ["Start with Hyrox Pure →", "Empezar con Hyrox Pure →"],
  "Upper, Lower, Push, Pull, Legs. La progression s'autopilote.": ["Upper, Lower, Push, Pull, Legs. Progression runs on autopilot.", "Upper, Lower, Push, Pull, Legs. La progresión funciona en piloto automático."],
  "Activation musculaire ciblée selon le split du jour.": ["Targeted muscle activation based on the day's split.", "Activación muscular específica según el split del día."],
  "Levé lourd, progression chargée.": ["Heavy lift, progressive loading.", "Levantamiento pesado, progresión de carga."],
  "Exercice complémentaire ciblé.": ["Targeted complementary exercise.", "Ejercicio complementario específico."],
  "Exercice complémentaire secondaire.": ["Secondary complementary exercise.", "Ejercicio complementario secundario."],
  "Étirements ciblés selon le split du jour.": ["Targeted stretching based on the day's split.", "Estiramientos específicos según el split del día."],
  "PROGRESSION AUTOPILOTÉE": ["AUTOPILOT PROGRESSION", "PROGRESIÓN EN PILOTO AUTOMÁTICO"],
  "+1 rep par set → plafond atteint": ["+1 rep per set → ceiling reached", "+1 rep por serie → techo alcanzado"],
  "+1 set supplémentaire → plafond atteint": ["+1 extra set → ceiling reached", "+1 serie extra → techo alcanzado"],
  "+charge": ["+load", "+carga"],
  "Séance complète · Progression chargée · PR possible": ["Full session · Progressive loading · PR possible", "Sesión completa · Progresión de carga · PR posible"],
  "Volume réduit · Charges maintenues · Pas de PR": ["Reduced volume · Loads maintained · No PR", "Volumen reducido · Cargas mantenidas · Sin PR"],
  "Accessory léger uniquement · Pas de Main Lift lourd": ["Light Accessory only · No heavy Main Lift", "Solo Accessory ligero · Sin Main Lift pesado"],
  "Commencer avec Volume Block Hypertrophy →": ["Start with Volume Block Hypertrophy →", "Empezar con Volume Block Hypertrophy →"],
  "Poids du corps en priorité. Aucune excuse, aucun équipement obligatoire.": ["Bodyweight first. No excuses, no equipment required.", "Peso corporal ante todo. Sin excusas, sin material obligatorio."],
  "Jumping jacks, mobilité articulaire, montées de genoux.": ["Jumping jacks, joint mobility, high knees.", "Jumping jacks, movilidad articular, elevaciones de rodillas."],
  "100% bodyweight. Pompes, squats, fentes, burpees...": ["100% bodyweight. Push-ups, squats, lunges, burpees...", "100% peso corporal. Flexiones, sentadillas, zancadas, burpees..."],
  "Gainage, dips chaise, glute bridge...": ["Core holds, chair dips, glute bridge...", "Isométricos de core, fondos en silla, glute bridge..."],
  "Core, mountain climbers, hollow body...": ["Core, mountain climbers, hollow body...", "Core, mountain climbers, hollow body..."],
  "Étirements, mobilité. Option run extérieur.": ["Stretching, mobility. Outdoor run option.", "Estiramientos, movilidad. Opción de carrera al aire libre."],
  "Cardio bodyweight": ["Bodyweight cardio", "Cardio con peso corporal"],
  "Core & Gainage": ["Core & Stability", "Core y estabilidad"],
  "Full Body Force": ["Full Body Strength", "Full Body Fuerza"],
  "Run extérieur ou récupération active": ["Outdoor run or active recovery", "Carrera al aire libre o recuperación activa"],
  "Séance complète · Intensité max · Option run extérieur": ["Full session · Max intensity · Outdoor run option", "Sesión completa · Intensidad máx. · Opción de carrera al aire libre"],
  "Volume réduit · Intensité 80% · Accessory uniquement": ["Reduced volume · 80% intensity · Accessory only", "Volumen reducido · Intensidad 80% · Solo Accessory"],
  "Marche extérieure · Mobilité douce · Pas de WOD": ["Outdoor walk · Gentle mobility · No WOD", "Caminata al aire libre · Movilidad suave · Sin WOD"],
  "Commencer avec At Home →": ["Start with At Home →", "Empezar con At Home →"],
  "Facultatif": ["Optional", "Opcional"],
  "Renfo Adaptatif": ["Adaptive Strengthening", "Refuerzo adaptativo"],
};

// --- Motifs (structures répétitives) -----------------------------------------------------------

const DAY_ABBR: Record<string, Tr> = { Lun: ["Mon", "Lun"], Mar: ["Tue", "Mar"], Mer: ["Wed", "Mié"], Jeu: ["Thu", "Jue"], Ven: ["Fri", "Vie"], Sam: ["Sat", "Sáb"], Dim: ["Sun", "Dom"] };

const CHAIN_LABEL: Record<string, Tr> = {
  poussée: ["push", "empuje"],
  épaules: ["shoulders", "hombros"],
  tirage: ["pull", "tirón"],
  jambes: ["legs", "piernas"],
  core: ["core", "core"],
};

const BLOCK_WORD: Tr = ["Block", "Bloque"];

const CHAIN_LIMITED_FR = "Sans barre de traction, les chaînes de tirage sont limitées (rowing sous une table, serviette).";
const CHAIN_LIMITED: Tr = [
  "Without a pull-up bar, pull chains are limited (table rows, towel).",
  "Sin barra de dominadas, las cadenas de tirón están limitadas (remo bajo una mesa, toalla).",
];

const idx = (lang: Lang): 0 | 1 | -1 => (lang === "en" ? 0 : lang === "es" ? 1 : -1);

/** Traduit un texte de contenu de programme. Renvoie le texte d'origine s'il n'y a pas de traduction (et toujours en français). */
export function tc(lang: Lang, text: string): string {
  if (lang === "fr" || !text) return text;
  const raw = idx(lang);
  if (raw === -1) return text;
  const i: 0 | 1 = raw;
  const hit = CONTENT[text];
  if (hit) return hit[i];
  const sep = text.indexOf(" · ");

  // "Bloc 2 — Skill / Strength" (fiches /training) : le numéro se traduit, le nom suit le dictionnaire.
  let m = /^Bloc (\d+) — (.+)$/.exec(text);
  if (m) return `${BLOCK_WORD[i]} ${m[1]} — ${tc(lang, m[2])}`;

  // "Cran actuel de ta chaîne poussée : Knee Push-up." (notes ajoutées par chains.ts)
  m = /^Cran actuel de ta chaîne (.+) : (.+)\.$/.exec(text);
  if (m) {
    const label = (CHAIN_LABEL[m[1]] ?? [m[1], m[1]])[i];
    return i === 0 ? `Current step of your ${label} chain: ${m[2]}.` : `Escalón actual de tu cadena de ${label}: ${m[2]}.`;
  }

  // Note de chaînes limitée, éventuellement après une note de jour.
  if (text.includes(CHAIN_LIMITED_FR)) {
    const before = text.replace(CHAIN_LIMITED_FR, "").trim();
    return [before ? tc(lang, before) : "", CHAIN_LIMITED[i]].filter(Boolean).join(" ");
  }

  // "Minute 4." / "Min 4."
  m = /^(?:Minute|Min) (\d+)\.$/.exec(text);
  if (m) return i === 0 ? `Minute ${m[1]}.` : `Minuto ${m[1]}.`;

  // "Lun" … "Dim"
  if (DAY_ABBR[text]) return DAY_ABBR[text][i];

  // "Back Squat (barre vide)" : nom de mouvement suivi d'une charge en texte libre.
  m = /^(.+?) \(([^()]+)\)$/.exec(text);
  if (m) {
    const inner = CONTENT[m[2]];
    if (inner) return `${m[1]} (${inner[i]})`;
  }

  // Notes concaténées par le code ("note · raison") : chaque morceau se traduit seul.
  if (sep > 0) {
    const parts = text.split(" · ");
    const out = parts.map((p) => CONTENT[p]?.[i] ?? p);
    if (out.some((p, k) => p !== parts[k])) return out.join(" · ");
  }

  // Notes concaténées par un espace (plusieurs phrases du dictionnaire mises bout à bout).
  const sentences = text.split(/(?<=\.) /);
  if (sentences.length > 1) {
    const out = sentences.map((s) => tc(lang, s));
    if (out.some((s, k) => s !== sentences[k])) return out.join(" ");
  }
  return text;
}

/** Fonction de traduction de contenu liée à une langue. */
export function makeTc(lang: Lang): (text: string) => string {
  return (text) => tc(lang, text);
}
