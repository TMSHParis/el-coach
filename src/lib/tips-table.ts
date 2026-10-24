// Table des conseils de la section « Demain » (partie 5, mission 1.5).
// Les phrases sont des PARAMÈTRES : une entrée par programme et séance, une par sport, et les
// conseils spécifiques par zone à ménager. Rien n'est généré à la volée.
// Chaque entrée a un statut `validated` (« validé par un coach »). Une entrée non validée n'est
// jamais affichée : la phrase générique (GENERIC_TIPS) la remplace. TOUTES les entrées ci-dessous
// sont des textes de départ NON VALIDÉS : un coach doit les relire, puis passer `validated` à true.
// Règle : aucun conseil médical, aucun diagnostic, aucune consigne de soin.

import { SPORT_GROUPS } from "./sports-catalog";
import { l10n, type L10n } from "./i18n/lang";

export type TipEntry = { label: string; warmup: L10n; tip: L10n; validated: boolean };
export type ZoneTipEntry = { zone: string; tip: L10n; validated: boolean };

/** Phrases génériques : affichées quand une entrée est absente ou non validée. {zone} = zone saisie telle quelle. */
export const GENERIC_TIPS = {
  warmup: l10n(
    "Prends 5 à 10 min pour monter progressivement en intensité avant de commencer.",
    "Take 5 to 10 min to build up gradually before you start.",
    "Dedica de 5 a 10 min a subir la intensidad poco a poco antes de empezar.",
  ),
  tip: l10n(
    "Prépare ta tenue et ta bouteille d'eau avant de partir.",
    "Get your kit and your water bottle ready before you go.",
    "Prepara tu ropa y tu botella de agua antes de salir.",
  ),
  zone: l10n(
    "{zone} signalée : adapte l'intensité et écoute ton corps.",
    "{zone} reported: adapt the intensity and listen to your body.",
    "{zone} indicada: adapta la intensidad y escucha a tu cuerpo.",
  ),
  restZone: l10n(
    "{zone} signalée : étire doucement et fais 5 min de mobilité douce.",
    "{zone} reported: stretch gently and do 5 min of easy mobility.",
    "{zone} indicada: estira con suavidad y haz 5 min de movilidad suave.",
  ),
};

/** Nombre maximal de caractères d'un conseil. */
export const TIP_MAX_CHARS = 110;

const e = (label: string, warmup: L10n, tip: L10n): TipEntry => ({ label, warmup, tip, validated: false });

const W_LOWER = l10n(
  "Active les fessiers, mobilise hanches et chevilles avant la première série.",
  "Activate your glutes and mobilise hips and ankles before the first set.",
  "Activa los glúteos y moviliza caderas y tobillos antes de la primera serie.",
);
const T_FIRST_LIGHT = l10n(
  "Commence par 2 séries légères du premier mouvement.",
  "Start with 2 light sets of the first movement.",
  "Empieza con 2 series ligeras del primer movimiento.",
);
const W_UPPER = l10n(
  "Chauffe épaules, omoplates et poignets avant les premières séries lourdes.",
  "Warm up shoulders, shoulder blades and wrists before the first heavy sets.",
  "Calienta hombros, escápulas y muñecas antes de las primeras series pesadas.",
);
const W_FULL = l10n(
  "Fais un échauffement complet : cardio léger, hanches, épaules et chevilles.",
  "Do a full warm-up: light cardio, hips, shoulders and ankles.",
  "Haz un calentamiento completo: cardio ligero, caderas, hombros y tobillos.",
);
const W_Z2 = l10n(
  "Démarre très doucement 5 à 10 min pour monter le cardio progressivement.",
  "Start very gently for 5 to 10 min to raise your heart rate gradually.",
  "Empieza muy suave durante 5 a 10 min para subir el pulso poco a poco.",
);
const T_Z2 = l10n(
  "Reste en zone 2 : une allure à laquelle tu peux tenir une conversation.",
  "Stay in zone 2: a pace at which you can hold a conversation.",
  "Mantente en zona 2: un ritmo en el que puedas mantener una conversación.",
);
const W_LONG = l10n(
  "Monte en intensité sur 10 min : cardio léger, mobilité hanches et épaules.",
  "Build up over 10 min: light cardio, hip and shoulder mobility.",
  "Sube la intensidad durante 10 min: cardio ligero y movilidad de caderas y hombros.",
);
const T_LONG = l10n(
  "Pars à une allure que tu peux tenir : le format est long, gère ton effort.",
  "Start at a pace you can hold: the format is long, manage your effort.",
  "Sal a un ritmo que puedas mantener: el formato es largo, dosifica el esfuerzo.",
);
const T_CONTROL = l10n(
  "Contrôle chaque répétition et garde 1 à 2 répétitions en réserve.",
  "Control every rep and keep 1 to 2 reps in reserve.",
  "Controla cada repetición y deja 1 o 2 repeticiones en reserva.",
);
const W_PUSHPULL = l10n(
  "Chauffe épaules et omoplates avec des tirages et des pompes légers.",
  "Warm up shoulders and shoulder blades with light pulls and push-ups.",
  "Calienta hombros y escápulas con tirones y flexiones ligeras.",
);

export const PROGRAM_TIPS: Record<string, TipEntry> = {
  "crossfit-pure:1": e("CrossFit Pure · Squat + cardio", W_LOWER, T_FIRST_LIGHT),
  "crossfit-pure:2": e(
    "CrossFit Pure · Gymnastique + force haut",
    l10n("Chauffe épaules et poignets : cercles, bande élastique, tractions légères.", "Warm up shoulders and wrists: circles, band work, light pull-ups.", "Calienta hombros y muñecas: círculos, banda elástica, dominadas ligeras."),
    l10n("Garde de la marge sur la gymnastique : la qualité du geste passe avant le nombre.", "Keep some margin on the gymnastics: quality of movement beats quantity.", "Deja margen en la gimnasia: la calidad del gesto va antes que la cantidad."),
  ),
  "crossfit-pure:3": e(
    "CrossFit Pure · Récupération active",
    l10n("Commence en douceur : 5 min de mouvements lents pour réveiller les articulations.", "Start gently: 5 min of slow movements to wake up your joints.", "Empieza con suavidad: 5 min de movimientos lentos para activar las articulaciones."),
    l10n("Reste à une intensité facile : tu dois pouvoir parler sans effort.", "Keep the intensity easy: you should be able to talk without effort.", "Mantén una intensidad fácil: debes poder hablar sin esfuerzo."),
  ),
  "crossfit-pure:4": e(
    "CrossFit Pure · Olympique + cardio",
    l10n("Mobilise chevilles, hanches et épaules, puis répète le geste à vide avec une barre légère.", "Mobilise ankles, hips and shoulders, then rehearse the lift with a light bar.", "Moviliza tobillos, caderas y hombros y repite el gesto con una barra ligera."),
    l10n("Monte les charges progressivement et garde une technique propre.", "Build the weights up gradually and keep your technique clean.", "Sube las cargas poco a poco y mantén una técnica limpia."),
  ),
  "crossfit-pure:5": e(
    "CrossFit Pure · Hinge",
    l10n("Active ischios et fessiers, mobilise les hanches avant les premières charges.", "Activate hamstrings and glutes, mobilise your hips before the first loads.", "Activa isquiotibiales y glúteos y moviliza las caderas antes de las primeras cargas."),
    l10n("Fais 2 séries légères de soulevé de terre avant les séries de travail.", "Do 2 light deadlift sets before your working sets.", "Haz 2 series ligeras de peso muerto antes de las series de trabajo."),
  ),
  "crossfit-pure:6": e("CrossFit Pure · WOD long / Hero", W_LONG, T_LONG),

  "hybrid-cf-strength:1": e("Hybrid Engine · Upper Force", W_UPPER, T_FIRST_LIGHT),
  "hybrid-cf-strength:2": e("Hybrid Engine · Lower Force", W_LOWER, T_FIRST_LIGHT),
  "hybrid-cf-strength:3": e("Hybrid Engine · Adaptatif Zone 2", W_Z2, T_Z2),
  "hybrid-cf-strength:4": e(
    "Hybrid Engine · Full Body Functional",
    W_FULL,
    l10n("Ajuste les charges pour garder un bon rythme sur tout le circuit.", "Adjust the loads to keep a good pace through the whole circuit.", "Ajusta las cargas para mantener un buen ritmo durante todo el circuito."),
  ),
  "hybrid-cf-strength:5": e("Hybrid Engine · Hypertrophie Push/Pull", W_PUSHPULL, T_CONTROL),
  "hybrid-cf-strength:6": e("Hybrid Engine · WOD long", W_LONG, T_LONG),

  "hyrox-pure:1": e("Hyrox Pure · Force haut du corps", W_UPPER, T_FIRST_LIGHT),
  "hyrox-pure:2": e(
    "Hyrox Pure · Intervalles course compromise",
    l10n("Fais 10 min de footing progressif, puis quelques lignes droites courtes.", "Do 10 min of progressive jogging, then a few short strides.", "Haz 10 min de trote progresivo y después unas rectas cortas."),
    l10n("Garde une allure régulière sur chaque intervalle : évite de partir trop vite.", "Keep an even pace on every interval: avoid starting too fast.", "Mantén un ritmo regular en cada intervalo: evita salir demasiado rápido."),
  ),
  "hyrox-pure:3": e(
    "Hyrox Pure · Stations en travail",
    l10n("Mobilise hanches, épaules et chevilles, puis répète les gestes des stations à vide.", "Mobilise hips, shoulders and ankles, then rehearse the station movements unloaded.", "Moviliza caderas, hombros y tobillos y repite los gestos de las estaciones sin carga."),
    l10n("Travaille la technique de chaque station avant d'accélérer.", "Work on the technique of each station before speeding up.", "Trabaja la técnica de cada estación antes de acelerar."),
  ),
  "hyrox-pure:4": e("Hyrox Pure · Force jambes", W_LOWER, T_FIRST_LIGHT),
  "hyrox-pure:5": e(
    "Hyrox Pure · Zone 2 longue",
    W_Z2,
    l10n("Reste en zone 2 et prévois de l'eau pour toute la durée.", "Stay in zone 2 and bring water for the whole session.", "Mantente en zona 2 y lleva agua para toda la sesión."),
  ),
  "hyrox-pure:6": e(
    "Hyrox Pure · Simulation half",
    l10n("Échauffe-toi 10 min : footing léger, mobilité, quelques gestes des stations.", "Warm up for 10 min: easy jog, mobility, a few station movements.", "Calienta 10 min: trote suave, movilidad y algunos gestos de las estaciones."),
    l10n("Pars plus lentement que prévu : la simulation se gagne sur la régularité.", "Start slower than planned: the simulation is won on consistency.", "Sal más lento de lo previsto: la simulación se gana con la regularidad."),
  ),

  "volume-block-hypertrophy:1": e("Volume Block · Upper", W_UPPER, T_FIRST_LIGHT),
  "volume-block-hypertrophy:2": e("Volume Block · Lower", W_LOWER, T_FIRST_LIGHT),
  "volume-block-hypertrophy:3": e("Volume Block · Push", W_PUSHPULL, T_FIRST_LIGHT),
  "volume-block-hypertrophy:4": e(
    "Volume Block · Pull",
    l10n("Active les omoplates avec des tirages à la bande et mobilise les épaules.", "Activate your shoulder blades with band pulls and mobilise the shoulders.", "Activa las escápulas con tirones de banda y moviliza los hombros."),
    T_FIRST_LIGHT,
  ),
  "volume-block-hypertrophy:5": e("Volume Block · Legs", W_LOWER, T_FIRST_LIGHT),

  "at-home:1": e("At Home · Full Body Force A", W_FULL, T_CONTROL),
  "at-home:2": e(
    "At Home · Cardio poids du corps",
    l10n("Monte progressivement : marche rapide sur place, montées de genoux, mobilité des chevilles.", "Build up gradually: brisk marching on the spot, high knees, ankle mobility.", "Sube poco a poco: marcha rápida en el sitio, rodillas arriba, movilidad de tobillos."),
    l10n("Prévois de la place autour de toi et une serviette.", "Clear some space around you and keep a towel nearby.", "Deja espacio a tu alrededor y ten una toalla a mano."),
  ),
  "at-home:3": e(
    "At Home · Core & Skills",
    l10n("Mobilise poignets, épaules et hanches avant les exercices de gainage.", "Mobilise wrists, shoulders and hips before the core work.", "Moviliza muñecas, hombros y caderas antes del trabajo de core."),
    l10n("Garde un bon alignement : mieux vaut un gainage plus court mais propre.", "Keep good alignment: a shorter, cleaner hold beats a longer sloppy one.", "Mantén una buena alineación: mejor una plancha más corta pero limpia."),
  ),
  "at-home:4": e("At Home · Full Body Force B", W_FULL, T_CONTROL),
  "at-home:5": e(
    "At Home · Cardio poids du corps",
    l10n("Monte progressivement : marche rapide sur place, montées de genoux, mobilité des chevilles.", "Build up gradually: brisk marching on the spot, high knees, ankle mobility.", "Sube poco a poco: marcha rápida en el sitio, rodillas arriba, movilidad de tobillos."),
    l10n("Prévois de la place autour de toi et une serviette.", "Clear some space around you and keep a towel nearby.", "Deja espacio a tu alrededor y ten una toalla a mano."),
  ),
  "at-home:6": e(
    "At Home · Run ou récupération active",
    l10n("Démarre par 5 min de marche rapide, puis mobilise chevilles et hanches.", "Start with 5 min of brisk walking, then mobilise ankles and hips.", "Empieza con 5 min de marcha rápida y moviliza tobillos y caderas."),
    l10n("Garde une allure facile et prévois de quoi t'hydrater.", "Keep an easy pace and bring something to drink.", "Mantén un ritmo fácil y lleva algo para hidratarte."),
  ),
};

const W_COMBAT = l10n(
  "Échauffe-toi 10 min : cardio léger, mobilité des hanches, des épaules et des chevilles.",
  "Warm up for 10 min: light cardio, hip, shoulder and ankle mobility.",
  "Calienta 10 min: cardio ligero y movilidad de caderas, hombros y tobillos.",
);
const T_COMBAT = l10n(
  "Prévois tes protections et ta bouteille d'eau.",
  "Pack your protective gear and your water bottle.",
  "Prepara tus protecciones y tu botella de agua.",
);
const W_ENDURANCE = l10n(
  "Démarre doucement 10 min et mobilise hanches et chevilles avant d'accélérer.",
  "Start gently for 10 min and mobilise hips and ankles before speeding up.",
  "Empieza suave 10 min y moviliza caderas y tobillos antes de acelerar.",
);
const T_ENDURANCE = l10n(
  "Prévois de quoi t'hydrater et pars à une allure que tu peux tenir.",
  "Bring something to drink and start at a pace you can hold.",
  "Lleva algo para hidratarte y sal a un ritmo que puedas mantener.",
);
const W_TEAM = l10n(
  "Fais monter le cœur progressivement : footing léger, appuis, mobilité des chevilles.",
  "Raise your heart rate gradually: easy jog, footwork, ankle mobility.",
  "Sube el pulso poco a poco: trote suave, apoyos y movilidad de tobillos.",
);
const T_TEAM = l10n(
  "Prévois ta tenue, ta bouteille d'eau et arrive quelques minutes en avance.",
  "Pack your kit and water bottle and arrive a few minutes early.",
  "Prepara tu equipación y tu botella de agua y llega unos minutos antes.",
);
const W_MOBILITY = l10n(
  "Commence par des mouvements lents pour mobiliser colonne, hanches et épaules.",
  "Start with slow movements to mobilise spine, hips and shoulders.",
  "Empieza con movimientos lentos para movilizar columna, caderas y hombros.",
);
const T_MOBILITY = l10n(
  "Cale ta respiration sur le mouvement et ne force aucune amplitude.",
  "Sync your breathing with the movement and never force a range.",
  "Sincroniza la respiración con el movimiento y no fuerces ninguna amplitud.",
);

const FAMILY_TIPS: { warmup: L10n; tip: L10n }[] = [
  { warmup: W_COMBAT, tip: T_COMBAT },
  { warmup: W_ENDURANCE, tip: T_ENDURANCE },
  { warmup: W_TEAM, tip: T_TEAM },
  { warmup: W_MOBILITY, tip: T_MOBILITY },
];

/** Une entrée par sport (clé = libellé du catalogue), toutes non validées au départ. */
export const SPORT_TIPS: Record<string, TipEntry> = (() => {
  const out: Record<string, TipEntry> = {};
  SPORT_GROUPS.forEach((g, i) => {
    for (const sport of g.options) out[sport] = e(sport, FAMILY_TIPS[i].warmup, FAMILY_TIPS[i].tip);
  });
  out["🥊 Boxe Thaï / Muay Thai"] = e(
    "🥊 Boxe Thaï / Muay Thai",
    l10n("Échauffe mollets et chevilles 10 min : montées sur pointes, cercles de chevilles.", "Warm up calves and ankles for 10 min: calf raises, ankle circles.", "Calienta gemelos y tobillos 10 min: elevaciones de talones y círculos de tobillo."),
    T_COMBAT,
  );
  return out;
})();

/** Conseils spécifiques par zone à ménager : à fournir par un coach (vide au départ, donc phrase générique seule). */
export const ZONE_TIPS: ZoneTipEntry[] = [];

export type ResolvedTips = { warmup: string; tip: string };

export function programTipKey(slug: string, dayNumber: number): string {
  return `${slug}:${dayNumber}`;
}

function pick(entry: TipEntry | undefined, field: "warmup" | "tip", lang: keyof L10n): string {
  if (entry?.validated && entry[field][lang]) return entry[field][lang];
  return GENERIC_TIPS[field][lang];
}

export function resolveProgramTips(slug: string, dayNumber: number, lang: keyof L10n): ResolvedTips {
  const entry = PROGRAM_TIPS[programTipKey(slug, dayNumber)];
  return { warmup: pick(entry, "warmup", lang), tip: pick(entry, "tip", lang) };
}

export function resolveSportTips(sport: string, lang: keyof L10n): ResolvedTips {
  const entry = SPORT_TIPS[sport];
  return { warmup: pick(entry, "warmup", lang), tip: pick(entry, "tip", lang) };
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Phrase de la zone : la zone est reprise telle que saisie ; un conseil précis n'existe que s'il est validé par un coach. */
export function zoneTip(zone: string, lang: keyof L10n, rest: boolean): string {
  const clean = zone.trim().replace(/\s+/g, " ");
  const specific = ZONE_TIPS.find((z) => z.validated && norm(clean).includes(norm(z.zone)));
  const template = specific && !rest ? specific.tip[lang] : GENERIC_TIPS[rest ? "restZone" : "zone"][lang];
  return template.replace("{zone}", clean);
}
