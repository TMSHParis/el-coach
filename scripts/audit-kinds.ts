// Audit du type de saisie de chaque mouvement de chaque séance des 5 programmes (mission 8).
import { programTemplates, resolveExerciseMovement } from "../src/lib/programming";

const ISO = /plank|hold|hollow|l-sit|wall-sit|dead-hang|handstand-hold|side-plank|superman|bridge-hold|isometric|deep-squat-hold/i;
type Row = { prog: string; day: number; block: string; btype: string; id: string; kind: string; issue?: string };
const rows: Row[] = [];
for (const t of programTemplates) {
  for (const d of t.weeks[0].days) {
    for (const b of d.blocks) {
      for (const ex of b.exercises) {
        const m = resolveExerciseMovement(ex);
        let kind: string;
        let issue: string | undefined;
        if (b.type === "warmup") kind = "echauffement";
        else if (b.type === "cooldown") kind = "retour_calme";
        else if (b.type === "endurance") kind = "endurance";
        else if (b.type === "wod" || b.type === "conditioning") {
          kind = "metcon";
          if (!b.format) issue = "bloc wod/conditioning sans format";
          if (typeof ex.sets === "number" && typeof ex.reps !== "undefined" && b.format === "StraightSets") issue = "musculation dans un bloc metcon";
        } else {
          const iso = ISO.test(ex.movementId) || ISO.test(m?.name ?? "");
          kind = iso || (ex.sets && ex.time && ex.reps === undefined) ? "gainage" : "musculation";
          if (kind === "musculation" && ex.reps === undefined && ex.time && !ex.sets) issue = "musculation sans séries/reps";
          if (kind === "musculation" && iso) issue = "isométrique prescrit avec reps";
          if (kind === "gainage" && ex.reps !== undefined) issue = "gainage prescrit avec reps";
        }
        if (!m) issue = "mouvement absent du catalogue";
        rows.push({ prog: t.slug, day: d.day, block: b.name, btype: b.type, id: ex.movementId, kind, issue });
      }
    }
  }
}
const count: Record<string, number> = {};
for (const r of rows) count[r.kind] = (count[r.kind] ?? 0) + 1;
console.log("répartition:", count);
const issues = rows.filter((r) => r.issue);
console.log("anomalies:", issues.length);
for (const r of issues) console.log(`${r.prog} j${r.day} [${r.block}/${r.btype}] ${r.id} -> ${r.kind} : ${r.issue}`);
