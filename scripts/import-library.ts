// Import de la bibliothèque de mouvements, WODs et séances modèles (partie 6, mission 2).
//
//   npx tsx scripts/import-library.ts                        base de .env.local (DATABASE_URL)
//   npx tsx scripts/import-library.ts --schema=lib_test      même base, schéma de test (copie isolée)
//   npx tsx scripts/import-library.ts --dry-run              lit et vérifie, n'écrit rien
//   npx tsx scripts/import-library.ts --report=rapport.md    écrit aussi le rapport en Markdown
//
// Source officielle : data/library/*.txt. Relançable : une exécution répétée donne le même résultat, sans doublon.
// Mise à jour d'une liste : remplacer le fichier de data/library, relancer le script (nouveaux éléments ajoutés,
// existants mis à jour). Les fiches validées par un coach (status != "importe_a_completer") gardent leur type.
// Le script ne touche à aucun programme, séance générée, semaine enregistrée ni historique d'utilisateur :
// il n'écrit que dans les tables lib_*.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { movements as appMovements } from "../src/lib/movements";
import { FILES, nameKey, parseLibrary, variantGroups, type FileId, type ParsedLibrary } from "./library/parse";

loadEnv({ path: ".env.local" });

const args = process.argv.slice(2);
const flag = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const schema = flag("schema");
const dryRun = args.includes("--dry-run");
const reportPath = flag("report");
const dir = join(process.cwd(), "data", "library");

type Counts = { created: number; updated: number; unchanged: number };
const zero = (): Counts => ({ created: 0, updated: 0, unchanged: 0 });
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export type Report = ReturnType<typeof buildReport>;

function buildReport(lib: ParsedLibrary, db: Record<"movements" | "combos" | "wods" | "templates", Counts> | null, linkedToApp: number, existingBefore: number, withoutVideo: number, withoutEquipment: number) {
  const mv = [...lib.movements.values()];
  const files = Object.fromEntries(
    FILES.map((f) => [
      f.id,
      {
        file: f.file,
        dashLines: lib.dashCount[f.id],
        expected: f.expectedDash,
        matches: lib.dashCount[f.id] === f.expectedDash,
        comboLines: lib.comboLines[f.id],
        choiceLines: lib.choiceLines[f.id],
        ...lib.perFile[f.id],
      },
    ]),
  ) as Record<FileId, { file: string; dashLines: number; expected: number; matches: boolean; comboLines: number; choiceLines: number } & ParsedLibrary["perFile"][FileId]>;

  const byWodName = new Map<string, string[]>();
  for (const w of lib.wods) {
    const k = `${w.group}|${nameKey(w.name)}`;
    byWodName.set(k, [...(byWodName.get(k) ?? []), `${w.name} (${w.source}, ${w.rawTitle})`]);
  }

  return {
    startedAt: new Date().toISOString(),
    schema: schema ?? "public",
    dryRun,
    files,
    totals: {
      movements: lib.movements.size,
      combos: lib.combos.size,
      wods: lib.wods.length,
      templates: lib.templates.length,
      linkedToAppMovements: linkedToApp,
      movementsAlreadyInDatabaseBeforeRun: existingBefore,
    },
    db,
    movementsA: {
      linesWithoutCombo: lib.dashCount.a - lib.comboLines.a,
      distinct: lib.aLineKeys.size,
      pushJerk: lib.movements.get(nameKey("Push Jerk"))?.categories ?? [],
    },
    aDefinir: mv.filter((m) => m.type === "a_definir").map((m) => ({ name: m.name, why: m.typeNote ?? "", sources: m.sources })),
    typeConflicts: lib.typeConflicts,
    variants: variantGroups(mv),
    wodsWithSameNameInSeveralFiles: [...byWodName.values()].filter((v) => v.length > 1),
    withoutVideo,
    withoutEquipment,
    unreadable: lib.warnings,
  };
}

async function main() {
  const texts = Object.fromEntries(FILES.map((f) => [f.id, readFileSync(join(dir, f.file), "utf8")])) as Record<FileId, string>;
  const lib = parseLibrary(texts);

  // Contrôle des comptes de la consigne : tout écart bloque l'import.
  const bad = FILES.filter((f) => lib.dashCount[f.id] !== f.expectedDash);
  if (bad.length) {
    for (const f of bad) console.error(`${f.file} : ${lib.dashCount[f.id]} lignes « - » lues, ${f.expectedDash} attendues`);
    process.exit(1);
  }

  // Mouvements déjà présents dans l'app (movements.ts) : vidéo, matériel et identifiant conservés.
  const appByKey = new Map(appMovements.map((m) => [nameKey(m.name), m]));
  let linked = 0;
  let noVideoStart = 0;
  let noEquipStart = 0;
  for (const m of lib.movements.values()) {
    const app = appByKey.get(m.key);
    if (app) linked++;
    if (!app?.videoUrl) noVideoStart++;
    if (!app || !app.equipment.length) noEquipStart++;
  }

  if (dryRun) {
    const rep = buildReport(lib, null, linked, 0, noVideoStart, noEquipStart);
    output(rep);
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL absente (.env.local).");
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }, schema ? { schema } : undefined) });
  try {
    const db = { movements: zero(), combos: zero(), wods: zero(), templates: zero() };
    let existingBefore = 0;

    await prisma.$transaction(
      async (tx) => {
        // --- Mouvements ---
        const existing = new Map((await tx.libMovement.findMany()).map((m) => [m.key, m]));
        existingBefore = existing.size;
        const toCreate: Prisma.LibMovementCreateManyInput[] = [];
        for (const m of lib.movements.values()) {
          const app = appByKey.get(m.key);
          const cur = existing.get(m.key);
          const sources = m.sources.map((s) => FILES.find((f) => f.id === s)!.file.replace(/\.txt$/, ""));
          if (!cur) {
            toCreate.push({
              key: m.key,
              name: m.name,
              aliases: m.aliases,
              categories: m.categories,
              type: m.type,
              sources,
              equipment: app ? [...app.equipment] : [],
              videoUrl: app?.videoUrl ?? null,
              appMovementId: app?.id ?? null,
            });
            db.movements.created++;
            continue;
          }
          const data = {
            name: m.name,
            aliases: m.aliases,
            categories: m.categories,
            sources,
            // Fiche validée par un coach : son type n'est plus modifié par l'import.
            type: cur.status === "importe_a_completer" ? m.type : cur.type,
            equipment: cur.equipment.length ? cur.equipment : app ? [...app.equipment] : [],
            videoUrl: cur.videoUrl ?? app?.videoUrl ?? null,
            appMovementId: cur.appMovementId ?? app?.id ?? null,
          };
          const changed = (Object.keys(data) as (keyof typeof data)[]).some((k) => !same(data[k], cur[k as keyof typeof cur]));
          if (changed) {
            await tx.libMovement.update({ where: { id: cur.id }, data });
            db.movements.updated++;
          } else db.movements.unchanged++;
        }
        if (toCreate.length) await tx.libMovement.createMany({ data: toCreate });
        const mvId = new Map((await tx.libMovement.findMany({ select: { id: true, key: true } })).map((m) => [m.key, m.id]));
        const idOf = (key: string | null) => (key ? (mvId.get(key) ?? null) : null);

        // --- Enchaînements ---
        const comboId = new Map<string, string>();
        const existingCombos = new Map((await tx.libCombo.findMany()).map((c) => [c.key, c]));
        for (const c of lib.combos.values()) {
          const data = {
            name: c.name,
            movementIds: c.components.map((k) => idOf(k)).filter((x): x is string => !!x),
            sources: c.sources.map((s) => FILES.find((f) => f.id === s)!.file.replace(/\.txt$/, "")),
          };
          const cur = existingCombos.get(c.key);
          if (!cur) {
            comboId.set(c.key, (await tx.libCombo.create({ data: { key: c.key, ...data } })).id);
            db.combos.created++;
          } else {
            comboId.set(c.key, cur.id);
            if (!same(data.movementIds, cur.movementIds) || cur.name !== data.name || !same(data.sources, cur.sources)) {
              await tx.libCombo.update({ where: { id: cur.id }, data });
              db.combos.updated++;
            } else db.combos.unchanged++;
          }
        }

        const lineRows = (owner: { wodId?: string; templateId?: string }, lines: ParsedLibrary["wods"][number]["lines"]) =>
          lines.map((l) => ({
            ...owner,
            position: l.position,
            part: l.part,
            partFormat: l.partFormat,
            kind: l.kind,
            quantity: l.quantity,
            slot: l.slot,
            note: l.note,
            raw: l.raw,
            movementId: idOf(l.movementKey),
            altMovementId: idOf(l.altMovementKey),
            comboId: l.comboKey ? (comboId.get(l.comboKey) ?? null) : null,
          }));

        // --- WODs ---
        const existingWods = new Map((await tx.libWod.findMany({ include: { lines: { orderBy: { position: "asc" } } } })).map((w) => [w.key, w]));
        for (const w of lib.wods) {
          const data = { name: w.name, group: w.group, subgroup: w.subgroup, source: w.source, format: w.format, scheme: w.scheme, timeCap: w.timeCap, rawTitle: w.rawTitle, position: w.position };
          const rows = (id: string) => lineRows({ wodId: id }, w.lines);
          const cur = existingWods.get(w.key);
          if (!cur) {
            const created = await tx.libWod.create({ data: { key: w.key, ...data } });
            await tx.libLine.createMany({ data: rows(created.id) });
            db.wods.created++;
            continue;
          }
          const wanted = rows(cur.id);
          const linesSame = cur.lines.length === wanted.length && cur.lines.every((l, i) => ["position", "part", "partFormat", "kind", "quantity", "slot", "note", "raw", "movementId", "altMovementId", "comboId"].every((k) => (l as Record<string, unknown>)[k] === (wanted[i] as Record<string, unknown>)[k]));
          const fieldsSame = (Object.keys(data) as (keyof typeof data)[]).every((k) => data[k] === cur[k]);
          if (fieldsSame && linesSame) {
            db.wods.unchanged++;
            continue;
          }
          await tx.libWod.update({ where: { id: cur.id }, data });
          if (!linesSame) {
            await tx.libLine.deleteMany({ where: { wodId: cur.id } });
            await tx.libLine.createMany({ data: wanted });
          }
          db.wods.updated++;
        }

        // --- Séances modèles ---
        const existingTpls = new Map((await tx.libTemplate.findMany({ include: { lines: { orderBy: { position: "asc" } } } })).map((t) => [t.key, t]));
        for (const t of lib.templates) {
          const data = { name: t.name, source: t.source, group: t.group, format: t.format, scheme: t.scheme, rawTitle: t.rawTitle, position: t.position };
          const rows = (id: string) => lineRows({ templateId: id }, t.lines);
          const cur = existingTpls.get(t.key);
          if (!cur) {
            const created = await tx.libTemplate.create({ data: { key: t.key, ...data } });
            await tx.libLine.createMany({ data: rows(created.id) });
            db.templates.created++;
            continue;
          }
          const wanted = rows(cur.id);
          const linesSame = cur.lines.length === wanted.length && cur.lines.every((l, i) => ["position", "part", "partFormat", "kind", "quantity", "slot", "note", "raw", "movementId", "altMovementId", "comboId"].every((k) => (l as Record<string, unknown>)[k] === (wanted[i] as Record<string, unknown>)[k]));
          const fieldsSame = (Object.keys(data) as (keyof typeof data)[]).every((k) => data[k] === cur[k]);
          if (fieldsSame && linesSame) {
            db.templates.unchanged++;
            continue;
          }
          await tx.libTemplate.update({ where: { id: cur.id }, data });
          if (!linesSame) {
            await tx.libLine.deleteMany({ where: { templateId: cur.id } });
            await tx.libLine.createMany({ data: wanted });
          }
          db.templates.updated++;
        }
      },
      { timeout: 180_000, maxWait: 30_000 },
    );

    // Compteurs réels de la base, après import.
    const [nv, nm, ne] = await Promise.all([
      prisma.libMovement.count({ where: { videoUrl: null } }),
      prisma.libMovement.count({ where: { equipment: { isEmpty: true } } }),
      prisma.libMovement.count(),
    ]);
    const rep = buildReport(lib, db, linked, existingBefore, nv, nm);
    (rep.totals as Record<string, number>).movementsInDatabase = ne;
    await prisma.libImportRun.create({ data: { report: JSON.parse(JSON.stringify(rep)) } });
    output(rep);
  } finally {
    await prisma.$disconnect();
  }
}

function output(r: Report) {
  const L: string[] = [];
  L.push(`# Import de la bibliothèque · ${r.startedAt}`, "", `Base : ${r.schema}${r.dryRun ? " (simulation, rien d'écrit)" : ""}`, "");
  L.push("## a) Éléments lus, créés et réutilisés", "");
  L.push("| Fichier | Lignes « - » lues / attendues | Enchaînements | Choix | Mouvements nouveaux | Mouvements déjà vus | WODs | Séances modèles |", "|---|---|---|---|---|---|---|---|");
  for (const id of ["a", "b", "c", "d"] as FileId[]) {
    const f = r.files[id];
    L.push(`| ${f.file} | ${f.dashLines} / ${f.expected} ${f.matches ? "OK" : "ÉCART"} | ${f.comboLines} | ${f.choiceLines} | ${f.movementsNew} | ${f.movementsSeen} | ${f.wods} | ${f.templates} |`);
  }
  L.push("", `Total : ${r.totals.movements} mouvements distincts, ${r.totals.combos} enchaînements, ${r.totals.wods} WODs, ${r.totals.templates} séances modèles.`);
  L.push(`Mouvements reliés à un mouvement déjà présent dans l'app (vidéo, matériel conservés) : ${r.totals.linkedToAppMovements}.`);
  if (r.db) {
    L.push("", "Dans la base pour cette exécution :", "", "| | créés | mis à jour | inchangés |", "|---|---|---|---|");
    for (const k of ["movements", "combos", "wods", "templates"] as const) L.push(`| ${k} | ${r.db[k].created} | ${r.db[k].updated} | ${r.db[k].unchanged} |`);
  }
  L.push("", `Fichier ecm-liste-mouvements : ${r.movementsA.linesWithoutCombo} lignes de mouvements et ${r.files.a.comboLines} enchaînements ; ${r.movementsA.distinct} mouvements distincts issus des lignes de mouvements ; Push Jerk : ${r.movementsA.pushJerk.join(" + ")}.`);
  L.push("", `## b) Mouvements de type « à définir » (${r.aDefinir.length})`, "", ...r.aDefinir.map((m) => `- ${m.name} (${m.sources.join(", ")})${m.why ? ` : ${m.why}` : ""}`));
  L.push("", `## Types obtenus par plusieurs règles (le premier fichier l'emporte, à valider) (${r.typeConflicts.length})`, "", ...r.typeConflicts.map((c) => `- ${c.name} : ${c.types.join(" / ")}`));
  L.push("", `## c) Variantes d'écriture possibles, non fusionnées (${r.variants.length} groupes)`, "", ...r.variants.map((g) => `- ${g.names.join("  |  ")}`));
  L.push("", "WODs de même nom présents dans plusieurs fichiers (non fusionnés) :", "", ...r.wodsWithSameNameInSeveralFiles.map((g) => `- ${g.join("  |  ")}`));
  L.push("", `## d) À compléter`, "", `- Mouvements sans vidéo : ${r.withoutVideo}`, `- Mouvements sans matériel : ${r.withoutEquipment}`);
  L.push("", `## e) Lignes qui n'ont pas pu être lues ou rangées sans réserve (${r.unreadable.length})`, "", ...(r.unreadable.length ? r.unreadable.map((w) => `- ${w.file} ligne ${w.lineNo} : ${w.text} (${w.reason})`) : ["- aucune"]));
  const md = L.join("\n");
  console.log(md);
  if (reportPath) writeFileSync(reportPath, md + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
