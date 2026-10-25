// Lecture des quatre listes de data/library (partie 6, mission 2). Pur : aucune base de données, aucune
// écriture. Retourne les mouvements, enchaînements, WODs et séances modèles, avec la liste de ce qui n'a pas
// pu être lu ou rangé. Aucun nom n'est traduit, corrigé ou reformulé : le nom de la liste est le nom retenu.

export const FILES = [
  { id: "a", file: "ecm-liste-mouvements.txt", expectedDash: 154, kind: "movements" },
  { id: "b", file: "ecm-liste-mouvements-wods.txt", expectedDash: 128, kind: "wods" },
  { id: "c", file: "ecm-liste-mouvements-crossfit-wods.txt", expectedDash: 210, kind: "wods" },
  { id: "d", file: "ecm-liste-mouvements-sources.txt", expectedDash: 129, kind: "templates" },
] as const;
export type FileId = (typeof FILES)[number]["id"];

export type MovementType = "musculation" | "gainage" | "endurance" | "metcon" | "echauffement" | "retour_au_calme" | "a_definir";

// ---------------------------------------------------------------------------------------------------------
// Clés de comparaison
// ---------------------------------------------------------------------------------------------------------

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function singular(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (/(ch|sh|x|ss)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 2 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

/** Même nom à la casse, au tiret, à l'espace et au pluriel près -> même clé. */
export function nameKey(name: string): string {
  return stripAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(singular)
    .join("");
}

// Variantes d'écriture à signaler (jamais fusionnées automatiquement).
const WORD_ALIASES: Record<string, string> = {
  db: "dumbbell",
  kb: "kettlebell",
  bb: "barbell",
  oh: "overhead",
  ohs: "overhead squat",
  t2b: "toes to bar",
  k2e: "knees to elbow",
  hspu: "handstand push up",
  du: "double under",
  rdl: "romanian deadlift",
  ghd: "ghd",
  s2oh: "shoulder to overhead",
};
const EQUIPMENT_WORDS = new Set(["dumbbell", "kettlebell", "barbell", "band", "cable", "ez", "bar", "rings", "ring", "med", "ball", "heavy", "american", "russian"]);

function variantCore(name: string): string {
  const words = stripAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .flatMap((w) => (WORD_ALIASES[w] ?? w).split(" "))
    .map(singular)
    .filter((w) => !EQUIPMENT_WORDS.has(w) && w !== "to" && w !== "and");
  return words.join("");
}

// ---------------------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------------------

export type ParsedMovement = {
  key: string;
  name: string;
  aliases: string[];
  categories: string[];
  sources: FileId[];
  /** Candidats de type avec leur origine (partie de séance, groupe, catégorie). */
  hints: { type: Exclude<MovementType, "a_definir">; why: string; file: FileId }[];
  type: MovementType;
  typeNote?: string;
};

export type ParsedCombo = { key: string; name: string; components: string[]; sources: FileId[] };

export type ParsedLine = {
  position: number;
  part: string | null;
  partFormat: string | null;
  kind: "movement" | "combo" | "choice";
  quantity: string | null;
  slot: string | null;
  note: string | null;
  raw: string;
  /** Clé du mouvement (ou de la première alternative d'un choix). */
  movementKey: string | null;
  altMovementKey: string | null;
  comboKey: string | null;
};

export type ParsedWod = {
  key: string;
  name: string;
  group: string;
  subgroup: string | null;
  source: FileId;
  format: string | null;
  scheme: string | null;
  timeCap: string | null;
  rawTitle: string;
  position: number;
  lines: ParsedLine[];
};

export type ParsedTemplate = Omit<ParsedWod, "timeCap" | "subgroup">;

export type Warning = { file: FileId; lineNo: number; text: string; reason: string };

export type ParsedLibrary = {
  movements: Map<string, ParsedMovement>;
  combos: Map<string, ParsedCombo>;
  wods: ParsedWod[];
  templates: ParsedTemplate[];
  warnings: Warning[];
  dashCount: Record<FileId, number>;
  comboLines: Record<FileId, number>;
  choiceLines: Record<FileId, number>;
  /** Mouvements d'un fichier : nouveaux (jamais vus avant) et déjà vus dans un fichier précédent. */
  perFile: Record<FileId, { movementsNew: number; movementsSeen: number; combos: number; wods: number; templates: number; lineCount: number }>;
  typeConflicts: { name: string; types: string[] }[];
  /** Clés des mouvements écrits sur leur propre ligne dans la liste (a), hors composants d'enchaînements. */
  aLineKeys: Set<string>;
};

// ---------------------------------------------------------------------------------------------------------
// Règles de type (point 4 de la consigne, valeurs de départ à valider)
// ---------------------------------------------------------------------------------------------------------

const MUSCU_CATEGORIES = new Set([
  "POUSSÉE VERTICALE",
  "POUSSÉE HORIZONTALE",
  "TRACTION VERTICALE",
  "TRACTION HORIZONTALE",
  "ÉPAULES ACCESSOIRES",
  "TRICEPS / BICEPS ACCESSOIRES",
  "SQUAT",
  "HIP HINGE",
  "FESSIERS / HANCHE",
  "UNILATÉRAL / ÉQUILIBRE",
  "MOLLETS / STABILITÉ",
  "MOUVEMENTS OLYMPIQUES",
  "FULL BODY COMPOSÉS",
  "FLEXION ABDOMINALE",
  "GAINAGE DYNAMIQUE",
]);
const STATIC_AS_MUSCU = new Set(["bearcrawl", "deadbug", "birddog", "ringbodysaw"].map((s) => s));
const ANTI_ROT_AS_GAINAGE = new Set(["copenhagenplank", "antirotationkbhold"]);

function categoryType(category: string, name: string): MovementType | null {
  const key = nameKey(name);
  if (key === "jumprope") return "endurance";
  if (category === "GAINAGE STATIQUE") return STATIC_AS_MUSCU.has(key) ? "musculation" : "gainage";
  if (category === "ANTI-ROTATION") return ANTI_ROT_AS_GAINAGE.has(key) ? "gainage" : "musculation";
  if (category === "FLEXION ABDOMINALE" && /^(l-sit|hanging l-sit)/i.test(name)) return "gainage";
  if (MUSCU_CATEGORIES.has(category)) return "musculation";
  return null;
}

/** Mouvements de cardio (exceptions de la règle « partie de séance »). Noms entiers, pas des mots d'un nom. */
const CARDIO_KEYS = new Set(
  ["Run", "Row", "Bike", "Ski", "Sprint", "Swim", "Shuttle Run", "Backward Run", "Calorie Row", "Calorie Bike", "Calorie Ski", "Calorie Echo Bike", "Echo Bike", "Assault Bike", "Sled Drag", "Reverse Sled Drag"].map(nameKey),
);

const PLANK_RE = /plank|hold/i;

// ---------------------------------------------------------------------------------------------------------
// Lecture d'une ligne
// ---------------------------------------------------------------------------------------------------------

const PROTECTED_LEADING_NUMBER = ["6 Inch Hold"];

type LineSyntax = { quantity: string | null; slot: string | null; note: string | null; names: string[]; comboName?: string; comboComponents?: string[]; kind: "movement" | "combo" | "choice" };

function joinQty(...parts: (string | null | undefined)[]): string | null {
  const s = parts.filter((p) => p && p.trim()).map((p) => p!.trim()).join(" ");
  return s || null;
}

/** Retire une quantité en tête de ligne ; retourne la quantité et le reste. */
function takeLeading(text: string): { qty: string | null; rest: string } {
  if (PROTECTED_LEADING_NUMBER.some((p) => text.startsWith(p))) return { qty: null, rest: text };
  let m: RegExpMatchArray | null;
  if ((m = text.match(/^(\d+(?:[.,]\d+)?(?:\/\d+(?:[.,]\d+)?)?)\s*(km|m|ft)\s+(.+)$/i))) return { qty: `${m[1]}${m[2]}`, rest: m[3] };
  if ((m = text.match(/^(\d+)\s*(miles?)\s+(.+)$/i))) return { qty: `${m[1]} ${m[2]}`, rest: m[3] };
  if ((m = text.match(/^(\d+['"])\s+(Max\s+)?(.+)$/))) return { qty: joinQty(m[1], m[2]), rest: m[3] };
  if ((m = text.match(/^(\d+:\d{2})\s+(.+)$/))) return { qty: m[1], rest: m[2] };
  if ((m = text.match(/^(\d+\s*\/\s*côté)\s+(.+)$/))) return { qty: m[1], rest: m[2] };
  if ((m = text.match(/^(\d+(?:\/\d+)?)\s+(.+)$/))) return { qty: m[1], rest: m[2] };
  if ((m = text.match(/^(MAX|Max)\s+(.+)$/))) return { qty: m[1], rest: m[2] };
  return { qty: null, rest: text };
}

const TAILS: RegExp[] = [
  /\s+(\d+\s*[×x]\s*\d+(?:[-–]\d+)?(?:\s?(?:sec|s|m|min))?["']?(?:\s*\/\s*(?:côté|jambe))?)$/,
  /\s+(\d+(?:,\s*\d+){2,})$/,
  /\s+([×x]\s*\d+(?:\s*sets?)?(?:\s*\/\s*(?:côté|jambe))?)$/,
  /\s+(\d+\s+sets?)$/,
  /\s+(\d+\s*(?:m|km))$/,
  /\s+(\d+["'])$/,
  /\s+(\d+\s*\/\s*côté)$/,
  /\s+(:\d+\s*\/\s*:\d+)$/,
  /\s+(max reps(?: unbroken)?)$/i,
];
const TRAILING_NOTE = /\s+(at the start of every minute|accumulé|unbroken)$/i;

function takeTrailing(text: string): { qty: string | null; rest: string } {
  for (const re of TAILS) {
    const m = text.match(re);
    if (m) return { qty: m[1].trim(), rest: text.slice(0, m.index).trimEnd() };
  }
  return { qty: null, rest: text };
}

/** Sépare la parenthèse (note) du nom, sauf si le nom complet est un nom de la liste des mouvements. */
function splitParen(text: string, keepWhole: (s: string) => boolean): { name: string; note: string | null } {
  if (keepWhole(text)) return { name: text, note: null };
  const notes: string[] = [];
  const name = text
    .replace(/\s*\(([^)]*)\)/g, (_m, inner: string) => {
      notes.push(inner.trim());
      return "";
    })
    .trim();
  return { name: name || text, note: notes.length ? notes.join("; ") : null };
}

function parseSyntax(raw: string, keepWhole: (s: string) => boolean): LineSyntax {
  let text = raw.replace(/^-\s+/, "").trim();
  let kind: LineSyntax["kind"] = "movement";
  if (/^\[COMBO\]\s*/.test(text)) {
    kind = "combo";
    text = text.replace(/^\[COMBO\]\s*/, "");
  } else if (/^\[CHOIX\]\s*/.test(text)) {
    kind = "choice";
    text = text.replace(/^\[CHOIX\]\s*/, "");
  }

  if (kind === "combo") {
    const [left, ...right] = text.split(" · ");
    const comboName = left.trim();
    const inner = comboName.match(/\(([^)]*\+[^)]*)\)/);
    const components = (inner ? inner[1] : comboName).split(/\s*(?:→|\+)\s*/).map((s) => s.trim()).filter(Boolean);
    return { kind, quantity: right.join(" · ").trim() || null, slot: null, note: null, names: [], comboName, comboComponents: components };
  }

  let slot: string | null = null;
  const sm = text.match(/^(M\d+)\s*:\s*(.+)$/);
  if (sm) {
    slot = sm[1];
    text = sm[2];
  }

  // « Squat Clean · 1 rep, 2 reps... » : ce qui suit « · » est la quantité de la ligne.
  let extraQty: string | null = null;
  const dot = text.indexOf(" · ");
  if (dot > 0) {
    extraQty = text.slice(dot + 3).trim();
    text = text.slice(0, dot).trim();
  }

  const lead = takeLeading(text);
  let rest = lead.rest;
  const tail = takeTrailing(rest);
  rest = tail.rest;
  let note: string | null = null;
  const tn = rest.match(TRAILING_NOTE);
  if (tn) {
    note = tn[1];
    rest = rest.slice(0, tn.index).trimEnd();
  }
  // Un second passage : la parenthèse peut précéder la quantité de fin (« Band TKE (…) 3×20 / jambe »).
  const paren = splitParen(rest, keepWhole);
  rest = paren.name;
  note = joinQty(note, paren.note);
  const tn2 = rest.match(TRAILING_NOTE);
  if (tn2) {
    note = joinQty(note, tn2[1]);
    rest = rest.slice(0, tn2.index).trimEnd();
  }
  // Quantité de fin restée derrière la parenthèse (« Russian Twist 3 sets (… ) »).
  const tail2 = takeTrailing(rest);
  rest = tail2.rest;
  let quantity = joinQty(lead.qty, tail.qty, tail2.qty, extraQty);

  if (kind === "choice") {
    const names = rest.split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
    // « 100m Run / Sprint × 6 sets » : la quantité de fin peut rester collée à la dernière alternative.
    const last = names[names.length - 1];
    const lt = takeTrailing(last);
    if (lt.qty) {
      names[names.length - 1] = lt.rest;
      quantity = joinQty(quantity, lt.qty);
    }
    return { kind, quantity, slot, note, names };
  }
  return { kind, quantity, slot, note, names: [rest] };
}

// ---------------------------------------------------------------------------------------------------------
// Titres de WODs / séances
// ---------------------------------------------------------------------------------------------------------

function parseTitle(title: string): { name: string; format: string | null; scheme: string | null; timeCap: string | null } {
  const parts = title.split(" · ").map((s) => s.trim());
  const name = parts[0];
  const rest = parts.slice(1);
  const joined = rest.join(" · ");
  const ladder = joined.match(/\d+(?:-\d+){2,}(?:\.\.\.)?/);
  const cap = joined.match(/(\d+)\s*min cap/i);
  const format = rest[0] ?? null;
  let scheme: string | null = null;
  if (ladder) scheme = ladder[0];
  else if (rest.length > 1) scheme = rest.slice(1).join(" · ");
  return { name, format, scheme, timeCap: cap ? `${cap[1]} min` : null };
}

const TEMPLATE_PART_RE = /^(Warm-up|Strength|Conditioning|Accessory \/ Core|Mobility)\b\s*(?:·\s*)?(.*)$/;
const WOD_PART_RE = /^(Partie \d+|Série \d+)\b\s*(?:·\s*)?(.*)$/;
const OPEN_YEAR_RE = /^\d{4}–\d{4}/;
const GROUP_CANON: Record<string, string> = { "HERO WODs": "Hero", "THE GIRLS": "The Girls", "BENCHMARKS GIRLS": "The Girls", "OPEN WODs": "Open" };

function partType(part: string | null, group: string): { type: Exclude<MovementType, "a_definir">; why: string } | null {
  if (part) {
    if (part.startsWith("Warm-up")) return { type: "echauffement", why: "partie Warm-up" };
    if (part.startsWith("Mobility")) return { type: "retour_au_calme", why: "partie Mobility" };
    if (part.startsWith("Conditioning")) return { type: "metcon", why: "partie Conditioning" };
    if (part.startsWith("Strength")) return { type: "musculation", why: "partie Strength" };
    if (part.startsWith("Accessory")) return { type: "musculation", why: "partie Accessory / Core" };
  }
  if (group === "STRENGTH / POWER") return { type: "musculation", why: "groupe Strength" };
  if (group === "CORE ACCESSORIES") return { type: "musculation", why: "groupe Accessory / Core" };
  if (group === "CONDITIONING") return { type: "metcon", why: "groupe Conditioning" };
  return null;
}

// ---------------------------------------------------------------------------------------------------------
// Lecture complète
// ---------------------------------------------------------------------------------------------------------

export function parseLibrary(texts: Record<FileId, string>): ParsedLibrary {
  const movements = new Map<string, ParsedMovement>();
  const combos = new Map<string, ParsedCombo>();
  const wods: ParsedWod[] = [];
  const templates: ParsedTemplate[] = [];
  const warnings: Warning[] = [];
  const dashCount = { a: 0, b: 0, c: 0, d: 0 } as Record<FileId, number>;
  const comboLines = { a: 0, b: 0, c: 0, d: 0 } as Record<FileId, number>;
  const choiceLines = { a: 0, b: 0, c: 0, d: 0 } as Record<FileId, number>;
  const aLineKeys = new Set<string>();
  const perFile = {} as ParsedLibrary["perFile"];
  for (const f of FILES) perFile[f.id] = { movementsNew: 0, movementsSeen: 0, combos: 0, wods: 0, templates: 0, lineCount: 0 };

  // Noms de la liste (a) : seuls ceux-là peuvent garder une parenthèse dans leur nom.
  const namesWithParen = new Set<string>();
  for (const l of texts.a.split("\n")) if (l.startsWith("- ") && /\(/.test(l)) namesWithParen.add(nameKey(l.replace(/^- (\[COMBO\]\s*)?/, "")));
  const keepWhole = (s: string) => namesWithParen.has(nameKey(s));

  function touch(name: string, file: FileId, hint?: ParsedMovement["hints"][number], category?: string): ParsedMovement {
    const key = nameKey(name);
    let m = movements.get(key);
    if (!m) {
      m = { key, name, aliases: [], categories: [], sources: [], hints: [], type: "a_definir" };
      movements.set(key, m);
      perFile[file].movementsNew++;
    } else if (!m.sources.includes(file)) {
      perFile[file].movementsSeen++;
    }
    if (m.name !== name && !m.aliases.includes(name)) m.aliases.push(name);
    if (!m.sources.includes(file)) m.sources.push(file);
    if (category && !m.categories.includes(category)) m.categories.push(category);
    if (hint) m.hints.push(hint);
    return m;
  }

  for (const f of FILES) {
    const lines = texts[f.id].split("\n");
    const nextNonBlank = (from: number) => {
      for (let j = from; j < lines.length; j++) if (lines[j].trim()) return lines[j];
      return null;
    };

    // État de lecture
    let category = ""; // fichier (a)
    let groupStack: string[] = [];
    let lastWasGroup = false;
    let curWod: ParsedWod | null = null;
    let curTpl: ParsedTemplate | null = null;
    let curPart: string | null = null;
    let curPartFormat: string | null = null;
    let tplHasParts = false;
    let indexMode = false;
    let position = 0;

    const topGroup = () => groupStack[0] ?? "";
    const finishLeaf = () => {
      curWod = null;
      curTpl = null;
      curPart = null;
      curPartFormat = null;
      tplHasParts = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      const lineNo = i + 1;
      if (!line.trim() || line.startsWith("LÉGENDE")) continue;

      if (!line.startsWith("- ")) {
        // ---- Titre ----
        if (f.kind === "movements") {
          category = line.trim();
          continue;
        }
        if (indexMode) continue; // « KB », « DB » : simples intitulés de l'index des nouveaux mouvements
        const title = line.trim();
        const nx = nextNonBlank(i + 1);
        const leaf = nx?.startsWith("- ") ?? false;

        // Partie d'une séance modèle ou d'un WOD déjà ouvert
        const tp = f.kind === "templates" && tplHasParts ? title.match(TEMPLATE_PART_RE) : null;
        const wp = f.kind === "wods" && curWod ? title.match(WOD_PART_RE) : null;
        if (tp) {
          curPart = tp[1];
          curPartFormat = tp[2].trim() || null;
          // « Conditioning AMRAP 12' » : le libellé de la partie garde son format.
          continue;
        }
        if (wp) {
          curPart = wp[1];
          curPartFormat = wp[2].replace(/^\((.*)\)$/, "$1").trim() || null;
          continue;
        }

        if (leaf || (nx && (f.kind === "templates" ? TEMPLATE_PART_RE.test(nx) : WOD_PART_RE.test(nx)))) {
          // WOD / séance modèle / circuit (avec ou sans parties)
          finishLeaf();
          lastWasGroup = false;
          const t = parseTitle(title);
          const group = GROUP_CANON[topGroup()] ?? topGroup();
          const subgroup = groupStack.length > 1 ? groupStack.slice(1).join(" / ") : null;
          position++;
          if (f.kind === "wods") {
            const baseKey = `${f.id}|${group}|${subgroup ?? ""}|${nameKey(t.name)}`;
            let key = baseKey;
            for (let n = 2; wods.some((w) => w.key === key); n++) key = `${baseKey}#${n}`;
            curWod = { key, name: t.name, group, subgroup, source: f.id, format: t.format, scheme: t.scheme, timeCap: t.timeCap, rawTitle: title, position, lines: [] };
            wods.push(curWod);
            perFile[f.id].wods++;
          } else {
            const baseKey = `${f.id}|${group}|${nameKey(t.name)}`;
            let key = baseKey;
            for (let n = 2; templates.some((w) => w.key === key); n++) key = `${baseKey}#${n}`;
            curTpl = { key, name: t.name, group, source: f.id, format: t.format, scheme: t.scheme, rawTitle: title, position, lines: [] };
            templates.push(curTpl);
            perFile[f.id].templates++;
            tplHasParts = !leaf;
          }
          if (title.startsWith("NOUVEAUX MOUVEMENTS")) indexMode = true; // sécurité (traité plus bas)
          continue;
        }

        // Groupe (WOD, séance ou sous-groupe)
        if (title.startsWith("NOUVEAUX MOUVEMENTS")) {
          indexMode = true;
          finishLeaf();
          groupStack = [title];
          continue;
        }
        finishLeaf();
        if (OPEN_YEAR_RE.test(title)) groupStack = [groupStack[0] ?? "", title];
        else if (lastWasGroup) groupStack.push(title);
        else groupStack = [title];
        lastWasGroup = true;
        continue;
      }

      // ---- Ligne « - » ----
      dashCount[f.id]++;
      lastWasGroup = false;
      const raw = line;
      const syn = parseSyntax(raw, keepWhole);

      // Fichier (a) : un mouvement ou un enchaînement par ligne, avec sa catégorie.
      if (f.kind === "movements") {
        if (syn.kind === "combo") {
          comboLines.a++;
          registerCombo(syn, f.id, category);
        } else {
          // Le nom de la liste (a) est exact : on ne retire ni parenthèse ni quantité.
          const name = raw.replace(/^-\s+/, "").trim();
          touch(name, f.id, undefined, category);
          aLineKeys.add(nameKey(name));
        }
        continue;
      }

      if (indexMode) {
        const name = raw.replace(/^-\s+/, "").trim();
        touch(name, f.id);
        continue;
      }

      const owner = curWod ?? curTpl;
      if (!owner) {
        warnings.push({ file: f.id, lineNo, text: raw, reason: "ligne sans WOD ni séance" });
        continue;
      }
      perFile[f.id].lineCount++;
      const part = curPart;
      const partFormat = curPartFormat;
      const hintFor = (): ParsedMovement["hints"][number] | undefined => {
        const pt = partType(part, topGroup());
        return pt ? { ...pt, file: f.id } : f.kind === "wods" ? { type: "metcon", why: "WOD", file: f.id } : undefined;
      };

      const base = { position: owner.lines.length + 1, part, partFormat, quantity: syn.quantity, slot: syn.slot, note: syn.note, raw };
      if (syn.kind === "combo") {
        comboLines[f.id]++;
        const ck = registerCombo(syn, f.id, null, hintFor());
        owner.lines.push({ ...base, kind: "combo", movementKey: null, altMovementKey: null, comboKey: ck });
        continue;
      }
      if (syn.kind === "choice") {
        choiceLines[f.id]++;
        if (syn.names.length !== 2) warnings.push({ file: f.id, lineNo, text: raw, reason: `choix avec ${syn.names.length} alternative(s) au lieu de 2` });
        const [n1, n2] = syn.names;
        const m1 = n1 ? touch(n1, f.id, hintFor()) : null;
        const m2 = n2 ? touch(n2, f.id, hintFor()) : null;
        owner.lines.push({ ...base, kind: "choice", movementKey: m1?.key ?? null, altMovementKey: m2?.key ?? null, comboKey: null });
        continue;
      }
      const name = syn.names[0];
      if (!name) {
        warnings.push({ file: f.id, lineNo, text: raw, reason: "aucun nom de mouvement lisible" });
        continue;
      }
      const m = touch(name, f.id, hintFor());
      owner.lines.push({ ...base, kind: "movement", movementKey: m.key, altMovementKey: null, comboKey: null });
      if (/\b(à|de|du|sur|dans|répétitions|progression|ladder)\b/i.test(name) || name.length > 45) {
        warnings.push({ file: f.id, lineNo, text: raw, reason: `le nom retenu « ${name} » ressemble à une consigne plutôt qu'à un mouvement` });
      }
    }
  }

  function registerCombo(syn: LineSyntax, file: FileId, cat: string | null, hint?: ParsedMovement["hints"][number]): string {
    const name = syn.comboName ?? "";
    const key = nameKey(name);
    for (const c of syn.comboComponents ?? []) touch(c, file, hint, cat ?? undefined);
    const existing = combos.get(key);
    if (existing) {
      if (!existing.sources.includes(file)) existing.sources.push(file);
    } else {
      combos.set(key, { key, name, components: (syn.comboComponents ?? []).map((c) => nameKey(c)), sources: [file] });
      perFile[file].combos++;
    }
    return key;
  }

  // Types
  const typeConflicts: ParsedLibrary["typeConflicts"] = [];
  for (const m of movements.values()) {
    if (m.categories.length) {
      const types = [...new Set(m.categories.map((c) => categoryType(c, m.name)).filter((t): t is MovementType => !!t))];
      if (types.length === 1 && CARDIO_KEYS.has(m.key) && types[0] !== "endurance") {
        // Ex. « Row » : mouvement d'un enchaînement (rowing à la barre) et machine de cardio dans les WODs.
        m.type = "a_definir";
        m.typeNote = `même nom qu'un mouvement de cardio : à départager (catégorie : ${types[0]}, cardio : endurance)`;
        typeConflicts.push({ name: m.name, types: [types[0], "endurance"] });
      } else if (types.length === 1) m.type = types[0];
      else if (types.length > 1) {
        m.type = "a_definir";
        m.typeNote = `catégories en désaccord : ${types.join(" / ")}`;
        typeConflicts.push({ name: m.name, types });
      } else m.typeNote = "catégorie sans règle";
      continue;
    }
    if (CARDIO_KEYS.has(m.key)) {
      m.type = "endurance";
      m.typeNote = "mouvement de cardio";
      continue;
    }
    const hints = m.hints
      .map((h) => (h.type === "musculation" && PLANK_RE.test(m.name) ? { ...h, type: "gainage" as const, why: `${h.why} (Plank / Hold)` } : h))
      .sort((x, y) => x.file.localeCompare(y.file));
    const types = [...new Set(hints.map((h) => h.type))];
    if (types.length === 1) m.type = types[0];
    else if (types.length > 1) {
      // Plusieurs règles s'appliquent : on retient celle du premier fichier, et on le signale pour validation.
      m.type = hints[0].type;
      m.typeNote = `plusieurs règles : ${types.join(" / ")} (retenu : ${hints[0].type}, ${hints[0].why})`;
      typeConflicts.push({ name: m.name, types });
    } else m.typeNote = "aucune règle ne s'applique (pas de partie de séance)";
  }

  return { movements, combos, wods, templates, warnings, dashCount, comboLines, choiceLines, perFile, typeConflicts, aLineKeys };
}

// ---------------------------------------------------------------------------------------------------------
// Variantes d'écriture à valider (jamais fusionnées)
// ---------------------------------------------------------------------------------------------------------

export function variantGroups(movements: Iterable<ParsedMovement>): { core: string; names: string[] }[] {
  const byCore = new Map<string, string[]>();
  for (const m of movements) {
    const core = variantCore(m.name);
    if (!core) continue;
    byCore.set(core, [...(byCore.get(core) ?? []), m.name]);
  }
  return [...byCore.entries()].filter(([, v]) => v.length > 1).map(([core, names]) => ({ core, names }));
}
