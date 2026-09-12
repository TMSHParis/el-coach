// ============================================================================
// Parse les 3 fichiers HTML de référence (scripts/source-html/) et génère :
//   - src/lib/movements-extended.ts (mouvements absents du catalogue actuel)
//   - src/lib/wods-extended.ts       (WODs Girls/Hero/Open absents de wods.ts)
//   - src/lib/source-program-examples.ts (programmes sources → texte d'inspiration)
//
// Exécution : npx tsx scripts/parse-content-library.ts
// Script one-shot mais versionné (relançable si Kamel ajoute d'autres exports).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { movements as existingMovements, type Movement, type Equipment, type MovementCategory, type Level } from "../src/lib/movements";
import { WODS as existingWods } from "../src/lib/wods";

const SRC_DIR = path.join(__dirname, "source-html");
const OUT_DIR = path.join(__dirname, "..", "src", "lib");

function readSrc(name: string): string {
  return fs.readFileSync(path.join(SRC_DIR, name), "utf8");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^station\s*\d+\s*[—-]\s*/i, "") // "Station 1 — Ski Erg" -> "Ski Erg"
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(name: string): string {
  return normalize(name).replace(/\s+/g, "-");
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base || "movement";
  let i = 2;
  while (taken.has(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  taken.add(slug);
  return slug;
}

// ----------------------------------------------------------------------------
// 1) MOUVEMENTS
// ----------------------------------------------------------------------------

const DISCIPLINE_TO_CATEGORY_HINT: Record<string, MovementCategory> = {
  muscu: "dumbbell",
  haltero: "barbell",
  gymn: "gymnastics",
  cf: "barbell",
  hyrox: "odd_object",
  func: "kettlebell",
  cali: "bodyweight",
  combat: "bodyweight",
  sports: "monostructural",
};

function inferEquipment(tagText: string): Equipment[] {
  const t = tagText.toLowerCase();
  const eq = new Set<Equipment>();
  if (/\bbb\b|barbell|trap bar/.test(t)) eq.add("barbell");
  if (/\bdb\b|dumbbell/.test(t)) eq.add("dumbbell");
  if (/\bkb\b|kettlebell/.test(t)) eq.add("kettlebell");
  if (/cable/.test(t)) eq.add("cable");
  if (/\bghd\b/.test(t)) eq.add("ghd");
  else if (/machine/.test(t)) eq.add("machine");
  if (/medball/.test(t)) eq.add("medball");
  if (/trx/.test(t)) eq.add("trx");
  if (/bande/.test(t)) eq.add("resistance_band");
  if (/sandbag/.test(t)) eq.add("sandbag");
  if (/sled/.test(t)) eq.add("sled");
  if (/roue abdo/.test(t)) eq.add("mat");
  if (eq.size === 0) eq.add("none"); // BW, Gymnastics, Skill, Cardio, Combat, Collectif...
  return [...eq];
}

function inferCategory(disciplineTab: string, equipment: Equipment[], subsection: string): MovementCategory {
  const sub = subsection.toLowerCase();
  if (/core|abdo/.test(sub)) return "core";
  if (/mobilit|récup|recovery/.test(sub)) return "mobility";
  if (equipment.includes("kettlebell")) return "kettlebell";
  if (equipment.includes("barbell")) return "barbell";
  if (equipment.includes("medball")) return "medball";
  if (equipment.includes("sled") || equipment.includes("sandbag")) return "odd_object";
  if (disciplineTab === "gymn" || disciplineTab === "cali") return "gymnastics";
  if (disciplineTab === "sports" || /cardio|course|endurance|aquatique/.test(sub)) return "monostructural";
  if (equipment.includes("none") && (disciplineTab === "combat" || disciplineTab === "func" || disciplineTab === "cali")) return "bodyweight";
  return DISCIPLINE_TO_CATEGORY_HINT[disciplineTab] ?? "bodyweight";
}

function inferLevel(text: string): Level {
  const t = text.toLowerCase();
  if (/elite|skill ultime|skill avanc/.test(t)) return "elite";
  if (/avanc/.test(t)) return "advanced";
  if (/débutant|debutant|accessible/.test(t)) return "beginner";
  return "intermediate";
}

type ParsedMove = {
  name: string;
  disciplineTab: string;
  subsection: string;
  equipmentTag: string;
  description: string;
  muscles: string[];
  ecmSlot?: string;
};

function parseMovementsHtml(html: string): ParsedMove[] {
  const out: ParsedMove[] = [];
  let disciplineTab = "";
  let subsection = "";

  // On avance ligne par ligne — le fichier source est déjà 1 élément par ligne.
  for (const line of html.split("\n")) {
    const tabMatch = line.match(/<div id="tab-([a-z]+)" class="section/);
    if (tabMatch) disciplineTab = tabMatch[1];

    const subMatch = line.match(/<div class="subsection">([^<]*)<\/div>/);
    if (subMatch) subsection = stripTags(subMatch[1]);

    if (!line.includes('class="move-card')) continue;

    const name = stripTags(line.match(/<div class="move-name">(.*?)<\/div>/)?.[1] ?? "");
    if (!name) continue;
    const equipmentTag = stripTags(line.match(/<div class="move-tag[^"]*">(.*?)<\/div>/)?.[1] ?? "");
    const description = stripTags(line.match(/<div class="move-desc">(.*?)<\/div>/)?.[1] ?? "");
    const muscles = [...line.matchAll(/<span class="pill">(.*?)<\/span>/g)].map((m) => stripTags(m[1]));
    const ecmRaw = stripTags(line.match(/<div class="move-ecm[^"]*">(.*?)<\/div>/)?.[1] ?? "");
    const ecmSlot = ecmRaw ? ecmRaw.replace(/^💡\s*ECM[^:]*:\s*/i, "").trim() : undefined;

    out.push({ name, disciplineTab, subsection, equipmentTag, description, muscles, ecmSlot });
  }
  return out;
}

function buildExtendedMovements(parsed: ParsedMove[]): Movement[] {
  const existingNames = new Set(existingMovements.map((m) => normalize(m.name)));
  const takenSlugs = new Set(existingMovements.map((m) => m.id));
  const seenInBatch = new Set<string>();
  const result: Movement[] = [];

  for (const p of parsed) {
    const key = normalize(p.name);
    if (existingNames.has(key) || seenInBatch.has(key)) continue;
    seenInBatch.add(key);

    const equipment = inferEquipment(p.equipmentTag);
    const category = inferCategory(p.disciplineTab, equipment, p.subsection);
    const level = inferLevel(`${p.equipmentTag} ${p.subsection} ${p.description}`);
    const tags: string[] = [slugify(p.subsection)];
    if (equipment.includes("none") && !["cf", "hyrox"].includes(p.disciplineTab)) tags.push("home-friendly");
    if (p.disciplineTab === "hyrox" && /station \d/i.test(p.name)) tags.push("hyrox-station");
    if (p.disciplineTab === "combat") tags.push("combat");
    if (p.disciplineTab === "sports") tags.push("sport-specifique");

    const id = uniqueSlug(slugify(p.name), takenSlugs);

    const movement: Movement = {
      id,
      name: p.name.replace(/^Station \d+\s*[—-]\s*/i, ""),
      category,
      equipment,
      level,
      tags,
      muscles: p.muscles.length > 0 ? p.muscles : undefined,
      description: p.description || undefined,
      ecmSlot: p.ecmSlot,
      hyroxStation: p.disciplineTab === "hyrox" && /station \d/i.test(p.name) ? true : undefined,
    };
    result.push(movement);
  }
  return result;
}

// ----------------------------------------------------------------------------
// 2) WODS (Girls / Hero / Open)
// ----------------------------------------------------------------------------

type ParsedWod = {
  name: string;
  category: "girls" | "heroes" | "open";
  format: string;
  movesRaw: string;
  rx: string[];
  ecm?: string;
};

const FORMAT_MAP: Record<string, string> = {
  "fmt-time": "ForTime",
  "fmt-amrap": "AMRAP",
  "fmt-rft": "RFT",
  "fmt-emom": "EMOM",
  "fmt-tabata": "Tabata",
  "fmt-chipper": "Chipper",
};

function parseWodsHtml(html: string): ParsedWod[] {
  const out: ParsedWod[] = [];
  const blocks = html.split(/<div class="wod (girls|hero|open)">/).slice(1);
  for (let i = 0; i < blocks.length; i += 2) {
    const cat = blocks[i] as "girls" | "hero" | "open";
    const body = blocks[i + 1];
    const end = body.indexOf("\n  </div>");
    const chunk = end >= 0 ? body.slice(0, end) : body;

    const name = stripTags(chunk.match(/<div class="wod-name[^"]*">(.*?)<\/div>/)?.[1] ?? "");
    if (!name) continue;
    const fmtClassMatch = chunk.match(/<div class="wod-format ([a-z-]+)">(.*?)<\/div>/);
    const format = fmtClassMatch ? (FORMAT_MAP[fmtClassMatch[1]] ?? "ForTime") : "ForTime";
    const movesRaw = stripTags(chunk.match(/<div class="wod-moves">([\s\S]*?)<\/div>/)?.[1] ?? "").replace(/\s+/g, " ");
    const rx = [...chunk.matchAll(/<span class="rx-pill">(.*?)<\/span>/g)].map((m) => stripTags(m[1]));
    const ecmRaw = stripTags(chunk.match(/<div class="wod-ecm[^"]*">(.*?)<\/div>/)?.[1] ?? "");
    const ecm = ecmRaw ? ecmRaw.replace(/^💡\s*ECM[^:]*:\s*/i, "").trim() : undefined;

    out.push({ name, category: cat === "hero" ? "heroes" : cat, format, movesRaw, rx, ecm });
  }
  return out;
}

// Table de correspondance nom (FR/EN, tel qu'il apparaît dans les WODs) -> movementId existant.
const MOVEMENT_NAME_TO_ID: Record<string, string> = {
  "thrusters": "thruster", "thruster": "thruster",
  "pull-ups": "kipping-pullup", "pull-up": "kipping-pullup", "pull-ups unbroken": "kipping-pullup",
  "chest-to-bar": "c2b", "c2b": "c2b", "chest-to-bar pull-ups": "c2b",
  "kb swings": "kb-swing-american", "kettlebell swings": "kb-swing-american",
  "run": "run", "run a reculons": "run", "shuttle run": "shuttle-run",
  "clean & jerks": "clean-and-jerk", "clean and jerk": "clean-and-jerk", "clean & jerk": "clean-and-jerk",
  "handstand push-ups": "hspu", "hspu": "hspu", "hspu ladder": "hspu", "hspupuis": "hspu",
  "deadlift": "deadlift", "deadlifts": "deadlift", "dl": "deadlift",
  "snatches": "power-snatch", "snatch": "power-snatch", "power snatches": "power-snatch",
  "wall balls": "wall-ball", "wall ball": "wall-ball", "wall-ball": "wall-ball", "wall balls (14.5) ou row calories (15.5)": "wall-ball",
  "double unders": "double-under", "double-unders": "double-under",
  "sit-ups": "ghd-situp", "ghd sit-ups": "ghd-situp",
  "push-ups": "pushup", "push-up": "pushup",
  "air squats": "air-squat", "squats": "air-squat", "squat": "air-squat",
  "box jumps": "box-jump", "box jump overs": "box-jump-over",
  "row": "row", "row calories": "row", "cal row": "row",
  "cleans": "clean", "clean": "clean", "squat cleans": "clean", "squat snatches": "power-snatch",
  "ring dips": "ring-dip",
  "overhead squats": "overhead-squat", "ohs": "overhead-squat", "oh squats": "overhead-squat",
  "burpees": "burpee", "burpee": "burpee", "burpees au maximum": "burpee", "burpees au debut de chaque minute": "burpee",
  "toes-to-bar": "t2b", "t2b": "t2b", "toes to bar": "t2b",
  "muscle-ups": "bar-muscleup", "ring muscle-ups": "ring-muscleup", "bar muscle-ups": "bar-muscleup",
  "power cleans": "power-clean", "power clean": "power-clean", "hang power cleans": "hang-power-clean",
  "push jerks": "push-jerk", "push press": "push-press", "split jerks": "split-jerk",
  "back squats": "back-squat", "front squats": "front-squat",
  "bench press": "bench-press", "bench press (bw)": "bench-press", "bench press max reps (bw)": "bench-press",
  "clean (3/4 bw)": "clean", "deadlift (1.5 bw)": "deadlift",
  "walking lunges": "walking-lunge", "ft walking lunges": "walking-lunge",
  "k2e": "k2e",
  "db snatch": "db-snatch", "db hang clean & jerk": "db-hang-clean-oh", "db hang squat cleans": "db-hang-clean",
  "db split cleans": "db-hang-clean",
  "muscle-up": "bar-muscleup", "bar-muscleups": "bar-muscleup",
  "wall walk": "wall-walk", "wall walks": "wall-walk",
  "ground-to-oh": "g2oh", "bar-facing burpees": "bar-facing-burpee",
  "strict hspu": "strict-hspu",
  "du": "double-under",
};

// Les clés ci-dessus utilisent des tirets par lisibilité ; normalize() les
// transforme en espaces — on construit donc la table de lookup déjà normalisée.
const NORMALIZED_MOVEMENT_DICT = new Map(
  Object.entries(MOVEMENT_NAME_TO_ID).map(([k, v]) => [normalize(k), v]),
);

// Nettoie une phrase d'intro FR/EN avant liste de mouvements ("Répéter le max de rounds :",
// "21-15-9 reps :", "de chaque :"...) — best effort, pas exhaustif.
const INTRO_PHRASE = /^(repeter le max de rounds|de chaque|puis|pas de timer)\s*:?\s*/i;

function tokenizeMoves(raw: string): string[] {
  const withoutScheme = raw.replace(/^[\d\-–,\s]+(reps?|rounds?)?\s*:?\s*/i, "");
  return withoutScheme
    .split(/·|,|\+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripLeadingNumber(s: string): string {
  // (?![a-z]) empêche "m" (mètres) de manger la première lettre du mot suivant
  // (ex: "muscle-ups" ne doit pas perdre son "m").
  return s.replace(/^\(?[\d.\/\-–]+\)?\s*(?:(?:ft|lb|kg|cal|m)(?![a-z]))?\s*/i, "").trim();
}

/** Capture un éventuel "30", "800m" en tête de token brut (avant normalisation). */
function captureLeadingQuantity(raw: string): { reps?: number; distance?: string } {
  const m = raw.trim().match(/^\(?(\d+(?:\.\d+)?)\)?\s*(m|km|ft)?\b/i);
  if (!m) return {};
  if (m[2]) return { distance: `${m[1]}${m[2]}` };
  const n = Number(m[1]);
  return Number.isFinite(n) ? { reps: n } : {};
}

type ResolvedExercise = { movementId: string; reps?: number; distance?: string; notes?: string };

function resolveExercise(rawToken: string): ResolvedExercise {
  const quantity = captureLeadingQuantity(rawToken);
  let t = normalize(rawToken);
  t = t.replace(INTRO_PHRASE, "").trim();
  t = normalize(stripLeadingNumber(t));

  const tryMatch = (): string | undefined => {
    if (NORMALIZED_MOVEMENT_DICT.has(t)) return NORMALIZED_MOVEMENT_DICT.get(t);
    const words = t.split(" ");
    for (let len = words.length; len >= 1; len--) {
      const candidate = words.slice(0, len).join(" ");
      if (NORMALIZED_MOVEMENT_DICT.has(candidate)) return NORMALIZED_MOVEMENT_DICT.get(candidate);
    }
    return undefined;
  };

  const id = tryMatch();
  if (id) return { movementId: id, ...quantity };
  return { movementId: `unrecognized-${slugify(rawToken)}`, notes: rawToken.trim() };
}

function buildExtendedWods(parsed: ParsedWod[]) {
  const existingNames = new Set(existingWods.map((w) => normalize(w.name)));
  const takenSlugs = new Set(existingWods.map((w) => w.slug));
  const result: Array<{
    slug: string;
    name: string;
    category: string;
    scheme: string;
    description: string;
    format: string;
    exercises: Array<{ movementId: string; notes?: string }>;
  }> = [];

  for (const p of parsed) {
    const key = normalize(p.name);
    if (existingNames.has(key)) continue;

    const tokens = tokenizeMoves(p.movesRaw);
    const exercises = tokens.map(resolveExercise);

    const slug = uniqueSlug(slugify(p.name), takenSlugs);
    result.push({
      slug,
      name: p.name,
      category: p.category,
      scheme: p.movesRaw,
      description: [p.ecm, p.rx.length ? `RX : ${p.rx.join(" · ")}` : ""].filter(Boolean).join(" — "),
      format: p.format,
      exercises,
    });
  }
  return result;
}

// ----------------------------------------------------------------------------
// 3) PROGRAMMES SOURCES (contexte texte pour le prompt de génération)
// ----------------------------------------------------------------------------

function parseSourcePrograms(html: string): string {
  const cards = html.split('<div class="wod-card">').slice(1);
  const chunks: string[] = [];
  for (const card of cards) {
    const end = card.indexOf("\n    </div>");
    const chunk = end >= 0 ? card.slice(0, end) : card;
    const name = stripTags(chunk.match(/<div class="wod-name"[^>]*>(.*?)<\/div>/)?.[1] ?? "");
    if (!name) continue;
    const format = stripTags(chunk.match(/<div class="wod-format"[^>]*>(.*?)<\/div>/)?.[1] ?? "");
    const moves = [...chunk.matchAll(/<div class="move-name">(.*?)<\/div><div class="move-detail">(.*?)<\/div>/g)]
      .map((m) => `  - ${stripTags(m[1])} : ${stripTags(m[2])}`)
      .join("\n");
    const note = stripTags(chunk.match(/<div class="wod-note"[^>]*>(.*?)<\/div>/)?.[1] ?? "");
    chunks.push(`### ${name}\n${format}\n${moves}${note ? `\nNote : ${note}` : ""}`);
  }
  return chunks.join("\n\n");
}

// ----------------------------------------------------------------------------
// RUN
// ----------------------------------------------------------------------------

const movementsHtml = readSrc("ecm-movements-db.html");
const parsedMoves = parseMovementsHtml(movementsHtml);
const extendedMovements = buildExtendedMovements(parsedMoves);

const wodsHtml = readSrc("ecm-crossfit-wods.html");
const parsedWods = parseWodsHtml(wodsHtml);
const extendedWods = buildExtendedWods(parsedWods);

const recapHtml = readSrc("ecm-wod-recap-sources.html");
const sourceProgramsText = parseSourcePrograms(recapHtml);

console.log(`Mouvements parsés : ${parsedMoves.length} · nouveaux (non dédupliqués) : ${extendedMovements.length}`);
console.log(`WODs parsés : ${parsedWods.length} · nouveaux : ${extendedWods.length}`);
const unmatched = extendedWods.flatMap((w) => w.exercises.filter((e) => e.movementId.startsWith("unrecognized-")).map((e) => `${w.name}: ${e.notes}`));
console.log(`Tokens WOD non mappés à un movementId (${unmatched.length}) :`);
for (const u of unmatched) console.log(`  - ${u}`);

// --- Écrit movements-extended.ts ---
const movementsOut = `// Généré par scripts/parse-content-library.ts depuis scripts/source-html/ecm-movements-db.html.
// Mouvements absents du catalogue historique (src/lib/movements.ts) au moment de la génération.
import type { Movement } from "./movements";

export const EXTENDED_MOVEMENTS: Movement[] = ${JSON.stringify(extendedMovements, null, 2)};
`;
fs.writeFileSync(path.join(OUT_DIR, "movements-extended.ts"), movementsOut);

// --- Écrit wods-extended.ts ---
const wodsOut = `// Généré par scripts/parse-content-library.ts depuis scripts/source-html/ecm-crossfit-wods.html.
// WODs Girls/Hero/Open absents de src/lib/wods.ts au moment de la génération.
// Les mouvements non reconnus (movementId "unmatched") sont à corriger manuellement
// avant intégration (voir le rapport affiché par le script).
import type { WodTemplate } from "./wods";

export const EXTENDED_WODS: WodTemplate[] = ${JSON.stringify(
  extendedWods.map((w) => ({
    slug: w.slug,
    name: w.name,
    category: w.category === "girls" ? "girls" : w.category === "heroes" ? "heroes" : "open",
    scheme: w.scheme,
    description: w.description,
    block: {
      name: w.name,
      type: "wod",
      format: w.format,
      exercises: w.exercises,
    },
  })),
  null,
  2,
)};
`;
fs.writeFileSync(path.join(OUT_DIR, "wods-extended.ts"), wodsOut);

// --- Écrit source-program-examples.ts ---
const sourceOut = `// Généré par scripts/parse-content-library.ts depuis scripts/source-html/ecm-wod-recap-sources.html.
// Programmes de sources externes (KB Flow, Gorila Program, jb23_fit, deee.fit...) —
// utilisés comme exemples de structure dans le prompt du moteur de génération
// (src/lib/ecm-engine.ts), jamais servis tels quels aux utilisateurs.
export const SOURCE_PROGRAM_EXAMPLES = \`${sourceProgramsText.replace(/\\/g, "\\\\").replace(/`/g, "\\`")}\`;
`;
fs.writeFileSync(path.join(OUT_DIR, "source-program-examples.ts"), sourceOut);

console.log("\nFichiers écrits : movements-extended.ts, wods-extended.ts, source-program-examples.ts");
