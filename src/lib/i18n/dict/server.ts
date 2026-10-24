import type { Entries } from "../types";

// Domaine « server » : textes de l'interface au format { "clé": [français, English, Español] }.
export const server = {
  // Erreurs renvoyées à l'UI
  "srv.err.checkinRequired": ["Complète les champs requis avant de valider.", "Fill in the required fields before submitting.", "Completa los campos obligatorios antes de validar."],
  "srv.err.signupInvalid": ["Vérifie tes informations et réessaie.", "Check your details and try again.", "Revisa tus datos e inténtalo de nuevo."],
  "srv.err.loginRequired": ["Connexion requise.", "Sign-in required.", "Inicio de sesión necesario."],
  "srv.err.loginFirst": ["Connecte-toi d'abord.", "Sign in first.", "Inicia sesión primero."],

  // Libellés de jours (historique sommeil / poids)
  "srv.day.0": ["Dim", "Sun", "Dom"],
  "srv.day.1": ["Lun", "Mon", "Lun"],
  "srv.day.2": ["Mar", "Tue", "Mar"],
  "srv.day.3": ["Mer", "Wed", "Mié"],
  "srv.day.4": ["Jeu", "Thu", "Jue"],
  "srv.day.5": ["Ven", "Fri", "Vie"],
  "srv.day.6": ["Sam", "Sat", "Sáb"],
  "srv.today": ["Auj.", "Today", "Hoy"],

  // Alertes sommeil
  "srv.sleep.deepRem": ["Sommeil profond et REM sous les seuils cette nuit", "Deep sleep and REM below thresholds tonight", "Sueño profundo y REM por debajo de los umbrales esta noche"],
  "srv.sleep.deep": ["Sommeil profond < 40 min cette nuit", "Deep sleep < 40 min last night", "Sueño profundo < 40 min esta noche"],
  "srv.sleep.rem": ["REM < 1h30 cette nuit", "REM < 1h30 last night", "REM < 1h30 esta noche"],
  "srv.sleep.awake": ["Réveils > 2h cette nuit", "Awake > 2h last night", "Despertares > 2h esta noche"],
  "srv.sleep.hint": ["Magnésium augmenté ce soir · écrans off 21h.", "More magnesium tonight · screens off at 9pm.", "Más magnesio esta noche · sin pantallas a las 21h."],

  // Repli : conseils hors programme
  "srv.fb.advice.w1": ["Mobilité articulaire générale", "General joint mobility", "Movilidad articular general"],
  "srv.fb.advice.w2": ["Montée progressive en intensité", "Gradual intensity build-up", "Subida progresiva de intensidad"],
  "srv.fb.advice.w3": ["Activation gainage et fessiers", "Core and glute activation", "Activación de core y glúteos"],
  "srv.fb.advice.p1": ["Hydrate-toi avant et pendant l'effort.", "Hydrate before and during effort.", "Hidrátate antes y durante el esfuerzo."],
  "srv.fb.advice.p2": ["Arrête ou ralentis en cas de douleur inhabituelle.", "Stop or slow down if you feel unusual pain.", "Para o reduce el ritmo si notas un dolor inusual."],
  "srv.fb.advice.mindset": ["Fais de ton mieux aujourd'hui, à ton rythme.", "Do your best today, at your own pace.", "Da lo mejor de ti hoy, a tu ritmo."],

  // Repli : repos
  "srv.fb.rest.w1": ["Étirements doux, sans forcer", "Gentle stretching, no forcing", "Estiramientos suaves, sin forzar"],
  "srv.fb.rest.w2": ["Marche tranquille", "Easy walk", "Caminata tranquila"],
  "srv.fb.rest.w3": ["Hydratation régulière sur la journée", "Steady hydration through the day", "Hidratación regular durante el día"],
  "srv.fb.rest.p1": ["Évite les efforts intenses aujourd'hui.", "Avoid intense effort today.", "Evita los esfuerzos intensos hoy."],
  "srv.fb.rest.p2": ["Surveille toute douleur qui persiste au repos.", "Watch for any pain that persists at rest.", "Vigila cualquier dolor que persista en reposo."],
  "srv.fb.rest.mindset": ["Le repos fait partie de l'entraînement. Tu progresses aussi aujourd'hui.", "Rest is part of training. You're progressing today too.", "El descanso forma parte del entrenamiento. Hoy también progresas."],

  // Repli : message mindset
  "srv.fb.mindset.rest": ["Jour de repos, {nom}. Récupère bien — c'est là que le vrai travail se fait.", "Rest day, {nom}. Recover well — that's where the real work happens.", "Día de descanso, {nom}. Recupera bien: ahí es donde se hace el verdadero trabajo."],
  "srv.fb.mindset.green": ["{nom}, t'es dans le vert aujourd'hui. Profites-en pour pousser les limites.", "{nom}, you're in the green today. Use it to push your limits.", "{nom}, hoy estás en verde. Aprovéchalo para superar tus límites."],
  "srv.fb.mindset.yellow": ["Pas le meilleur jour, {nom}. Mais tu t'es levé et tu vas le faire. C'est ça qui compte.", "Not your best day, {nom}. But you got up and you're going to do it. That's what counts.", "No es tu mejor día, {nom}. Pero te has levantado y lo vas a hacer. Eso es lo que cuenta."],
  "srv.fb.mindset.red": ["{nom}, ton corps est dans le rouge. Séance légère aujourd'hui. Pas d'ego.", "{nom}, your body is in the red. Light session today. No ego.", "{nom}, tu cuerpo está en rojo. Sesión ligera hoy. Sin ego."],
  "srv.fb.mindset.athlete": ["Athlète", "Athlete", "Atleta"],

  // Séance de conseils / récupération (advice-session)
  "srv.adv.recovery": ["Récupération", "Recovery", "Recuperación"],
  "srv.adv.sessionOfDay": ["Séance du jour", "Today's session", "Sesión de hoy"],
  "srv.adv.activeRecovery": ["Récupération active", "Active recovery", "Recuperación activa"],
  "srv.adv.warmup": ["Échauffement", "Warm-up", "Calentamiento"],
  "srv.adv.optional": ["Facultatif", "Optional", "Opcional"],
  "srv.adv.watchPoints": ["Points de vigilance", "Watch points", "Puntos de atención"],
  "srv.adv.injuryPrevention": ["Prévention des blessures", "Injury prevention", "Prevención de lesiones"],
  "srv.adv.tips": ["Conseils", "Tips", "Consejos"],
  "srv.adv.mindsetRecovery": ["Mindset récupération", "Recovery mindset", "Mentalidad de recuperación"],
  "srv.adv.mindset": ["Mindset", "Mindset", "Mentalidad"],
  "srv.adv.mental": ["Mental", "Mental", "Mental"],
  "srv.adv.def.w1": ["Marche tranquille", "Easy walk", "Caminata tranquila"],
  "srv.adv.def.w2": ["Rotations de hanches", "Hip rotations", "Rotaciones de cadera"],
  "srv.adv.def.w3": ["Fente basse (mobilité)", "Low lunge (mobility)", "Zancada baja (movilidad)"],
  "srv.adv.def.w4": ["Respiration diaphragmatique", "Diaphragmatic breathing", "Respiración diafragmática"],
  "srv.adv.def.d3": ["8 reps / côté", "8 reps / side", "8 reps / lado"],
  "srv.adv.def.p1": ["Reste à une intensité où tu peux parler sans t'essouffler.", "Stay at an intensity where you can talk without getting out of breath.", "Mantén una intensidad en la que puedas hablar sin ahogarte."],
  "srv.adv.def.p2": ["Hydrate-toi régulièrement, même sans effort.", "Hydrate regularly, even without effort.", "Hidrátate con regularidad, incluso sin esfuerzo."],
  "srv.adv.def.p3": ["Évite toute position qui provoque une douleur vive.", "Avoid any position that causes sharp pain.", "Evita cualquier postura que provoque un dolor agudo."],
  "srv.adv.def.mindset": ["Aujourd'hui, ton corps se reconstruit. Respire, bouge doucement, n'ajoute rien de plus.", "Today, your body is rebuilding. Breathe, move gently, don't add anything more.", "Hoy tu cuerpo se reconstruye. Respira, muévete con suavidad y no añadas nada más."],

  // Notes de phase (compétition / Hyrox)
  "srv.phase.construction": ["Construction", "Build", "Construcción"],
  "srv.phase.specifique": ["Spécifique", "Specific", "Específica"],
  "srv.phase.affutage": ["Affûtage", "Taper", "Puesta a punto"],
  "srv.phase.course": ["Course", "Race", "Carrera"],
  "srv.phase.sentence.specifique": ["Plus de simulations et de course compromise. La séance de samedi passe en simulation half.", "More simulations and compromised running. Saturday's session becomes a half simulation.", "Más simulacros y carrera con fatiga. La sesión del sábado pasa a simulacro half."],
  "srv.phase.sentence.affutage": ["On garde l'intensité et la course compromise, on réduit le volume. Rien de nouveau à ce stade.", "We keep the intensity and compromised running, and cut the volume. Nothing new at this stage.", "Mantenemos la intensidad y la carrera con fatiga, y reducimos el volumen. Nada nuevo en esta fase."],
  "srv.phase.sentence.course": ["Semaine de course : rien de lourd, rien de nouveau.", "Race week: nothing heavy, nothing new.", "Semana de carrera: nada pesado, nada nuevo."],
  "srv.phase.sentence.construction": ["On construit la base : Zone 2, force et technique des stations.", "We build the base: Zone 2, strength and station technique.", "Construimos la base: Zona 2, fuerza y técnica de las estaciones."],
  "srv.phase.noteTaper": ["{label} · volume {pct} % du volume normal, intensité conservée.", "{label} · volume at {pct}% of normal, intensity kept.", "{label} · volumen al {pct} % del normal, intensidad conservada."],
  "srv.phase.noteSpecific": ["Phase Spécifique : plus de simulations et de course compromise.", "Specific phase: more simulations and compromised running.", "Fase Específica: más simulacros y carrera con fatiga."],
  "srv.race.dayFocus": ["JOUR J · HYROX", "RACE DAY · HYROX", "DÍA D · HYROX"],
  "srv.race.dayNotes": ["Charges de référence affichées sur la carte Préparation. Rien de nouveau.", "Reference weights shown on the Preparation card. Nothing new.", "Cargas de referencia en la tarjeta Preparación. Nada nuevo."],
  "srv.race.restFocus": ["Repos", "Rest", "Descanso"],
  "srv.race.restNotes": ["Repos, sommeil, hydratation, matériel prêt.", "Rest, sleep, hydration, gear ready.", "Descanso, sueño, hidratación, material listo."],
  "srv.race.activFocus": ["Séance d'activation", "Activation session", "Sesión de activación"],
  "srv.race.activNotes": ["Deux jours avant la course : courte et vive, rien de lourd.", "Two days before the race: short and sharp, nothing heavy.", "Dos días antes de la carrera: corta y viva, nada pesado."],
  "srv.race.activName": ["Activation", "Activation", "Activación"],
  "srv.race.activRun": ["Allure course, vif.", "Race pace, snappy.", "Ritmo de carrera, vivo."],
  "srv.race.jogFocus": ["Footing de décrassage", "Recovery jog", "Trote de descarga"],
  "srv.race.jogNotes": ["Allure facile, 20 à 30 min.", "Easy pace, 20 to 30 min.", "Ritmo suave, 20 a 30 min."],
  "srv.race.jogName": ["Footing", "Jog", "Trote"],
  "srv.race.jogRun": ["Allure facile.", "Easy pace.", "Ritmo suave."],

  // Libellés injectés dans les prompts / valeurs de repli
  "srv.sport.fallback": ["Séance", "Session", "Sesión"],
} as const satisfies Entries;
