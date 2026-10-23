// Textes de la page "Séance terminée" (mission B). Tout est calculé à partir de
// données connues : aucune phrase n'affirme ce que l'app ne mesure pas, et
// chaque comparaison (fourchette, durée) n'est écrite qu'après vérification.

import type { BlocSummary, SessionBlocResult } from "@/app/session/actions";

/** "1h59" — h minuscule partout ; sous une heure : "45 min". */
export function fmtDurationH(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m} min`;
}

export type SerieLike = NonNullable<SessionBlocResult["series"]>[number];

/** "43 kg × 5", "20 reps", "32 kg × 40 m", "0:45" — jamais "—kg". Null si la série est vide. */
export function fmtSerie(s: SerieLike, kind: string | undefined): string | null {
  const charge = parseFloat(s.charge);
  const hasCharge = Number.isFinite(charge) && charge > 0;
  const reps = s.reps?.trim();
  if (kind === "endurance") return s.time?.trim() || null;
  if (kind === "hold" || (!reps && s.time?.trim())) {
    const t = s.time?.trim();
    if (!t) return null;
    return hasCharge ? `${t} · +${charge} kg` : t;
  }
  if (kind === "carry") {
    if (!reps) return hasCharge ? `${charge} kg` : null;
    const unit = s.unit ?? "m";
    return hasCharge ? `${charge} kg × ${reps} ${unit}` : `${reps} ${unit}`;
  }
  if (hasCharge) return reps ? `${charge} kg × ${reps}` : `${charge} kg`;
  return reps ? `${reps} reps` : null;
}

/** Valeur de tri pour repérer la meilleure série (charge, sinon reps, sinon secondes tenues). */
function serieScore(s: SerieLike): number {
  const charge = parseFloat(s.charge);
  if (Number.isFinite(charge) && charge > 0) return charge * 1000 + (parseFloat(s.reps) || 0);
  const reps = parseFloat(s.reps);
  if (Number.isFinite(reps)) return reps;
  const m = s.time?.match(/^(\d+):(\d{2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return parseFloat(s.time ?? "") || 0;
}

export function bestSerieIndex(series: SerieLike[]): number {
  let best = -1;
  let bestScore = -1;
  series.forEach((s, i) => {
    const sc = serieScore(s);
    if (sc > bestScore) {
      best = i;
      bestScore = sc;
    }
  });
  return best;
}

export type RecapBloc = {
  bloc: number;
  titre: string;
  type: string;
  format?: string;
  done: boolean;
  /** Résultat global du bloc (WOD : temps, rounds, score). */
  wodLine: string | null;
  items: { name: string; done: boolean; kind: string; series: SerieLike[]; /** Mouvement prévu quand celui-ci l'a remplacé (mission 11). */ replacedFrom?: string }[];
};

const WARMUP_TYPES = ["warmup", "cooldown"];

/**
 * Fusionne le résumé des blocs (tous les blocs, réalisés ou non) avec les
 * résultats saisis. Séances antérieures sans résumé : on reconstruit les blocs
 * à partir des seuls résultats enregistrés.
 */
export function buildRecapBlocs(summary: BlocSummary[] | undefined, results: SessionBlocResult[]): RecapBloc[] {
  const wodLineFor = (r: SessionBlocResult | undefined): string | null => {
    if (!r) return null;
    const parts = [r.temps && r.temps, r.rounds && `${r.rounds} rounds`, r.score && `${r.score} reps bonus`].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  };

  if (summary && summary.length > 0) {
    return summary.map((b) => {
      const wod = results.find((r) => r.bloc === b.bloc && r.nom === b.titre && !r.series);
      const items = b.items.map((it) => {
        const r = results.find((x) => x.bloc === b.bloc && x.nom === it.name && x.series);
        const times = results.find((x) => x.bloc === b.bloc && x.nom === it.name && !x.series && x.temps);
        return {
          name: it.name,
          done: it.done,
          kind: it.kind,
          replacedFrom: it.replacedFrom,
          series: r?.series ?? (times?.temps ? [{ charge: "", reps: "", time: times.detail ?? times.temps }] : []),
        };
      });
      // Séries saisies sous un mouvement remplacé puis changé ou rétabli : listées avec leur mouvement.
      for (const r of results) {
        if (r.bloc !== b.bloc || !r.series || items.some((x) => x.name === r.nom)) continue;
        items.push({ name: r.nom, done: true, kind: r.kind ?? "strength", replacedFrom: r.remplaceDe, series: r.series });
      }
      return {
        bloc: b.bloc,
        titre: b.titre,
        type: b.type,
        format: b.format,
        done: b.done,
        wodLine: wodLineFor(wod),
        items,
      };
    });
  }

  const byBloc = new Map<number, SessionBlocResult[]>();
  for (const r of results) byBloc.set(r.bloc, [...(byBloc.get(r.bloc) ?? []), r]);
  return [...byBloc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bloc, rs]) => {
      const wod = rs.find((r) => !r.series);
      return {
        bloc,
        titre: wod?.nom ?? `Bloc ${bloc}`,
        type: "unknown",
        done: true,
        wodLine: wodLineFor(wod),
        items: rs
          .filter((r) => r.series)
          .map((r) => ({ name: r.nom, done: true, kind: r.kind ?? "strength", series: r.series ?? [], replacedFrom: r.remplaceDe })),
      };
    });
}

/** Résultat clé affiché sur la ligne repliée d'un bloc. */
export function blocKeyResult(b: RecapBloc): string | null {
  if (WARMUP_TYPES.includes(b.type)) return b.format ?? null;
  if (b.wodLine) return b.wodLine;
  let best: { name: string; text: string; score: number } | null = null;
  for (const it of b.items) {
    if (it.series.length === 0) continue;
    const i = bestSerieIndex(it.series);
    const text = fmtSerie(it.series[i], it.kind);
    if (!text) continue;
    const score = serieScore(it.series[i]);
    if (!best || score > best.score) best = { name: it.name, text, score };
  }
  if (!best) return null;
  return b.items.length === 1 ? `meilleure série ${best.text}` : `${best.name} : ${best.text}`;
}

export type MissingEntry = { bloc: string; elements: string[] };

/** Ce qui manque : mouvements non cochés, groupés par bloc (vide si 100 %). */
export function missingEntries(blocs: RecapBloc[]): MissingEntry[] {
  return blocs
    .map((b) => ({ bloc: b.titre, elements: b.items.filter((i) => !i.done).map((i) => i.name) }))
    .filter((e) => e.elements.length > 0);
}

const MENTAL_WORD: Record<string, string> = { clair: "clair", moyen: "moyen", brouillard: "dans le brouillard" };

export function coachMessage(input: {
  prenom: string;
  durationSec: number;
  percent: number;
  energie: number | null;
  mental: string | null;
  best: { nom: string; charge: number; reps: string } | null;
  wod: { titre: string; temps: string } | null;
}): string {
  const mentalKey = (input.mental ?? "").replace(/[^\p{L}]/gu, "").toLowerCase();
  const mental = MENTAL_WORD[mentalKey];
  let first = `${input.prenom}, ${fmtDurationH(input.durationSec)}`;
  if (input.energie !== null) first += ` avec une énergie à ${input.energie}/10`;
  if (mental) first += `${input.energie !== null ? " et" : " avec"} un mental ${mental}`;
  first += input.percent >= 70 ? " : belle séance." : ` : séance faite à ${input.percent} %.`;

  const parts = [first];
  if (input.best) {
    const reps = input.best.reps ? ` × ${input.best.reps}` : "";
    parts.push(`Ta charge la plus haute du jour : ${input.best.nom}, ${input.best.charge} kg${reps}.`);
  }
  if (input.wod) parts.push(`${input.wod.titre} : ${input.wod.temps}.`);
  return parts.join(" ");
}

export type WatchData = {
  kcalActive: number | null;
  kcalTotal: number | null;
  effort: string | null;
  bpm: number | null;
  /** Calories lues sans savoir si c'est l'activité (2e activité du jour). */
  kcalUnknown?: number | null;
};

export type WatchDebrief = {
  text: string | null;
  gauge: { min: number; max: number; value: number } | null;
};

/** Débrief de la montre — chaque affirmation est vérifiée contre les données avant d'être écrite. */
export function watchDebrief(
  w: WatchData,
  durationSec: number,
  past: { kcal: number | null; durationSec: number | null }[],
): WatchDebrief {
  if (w.kcalActive === null) return { text: null, gauge: null };
  const kcals = past.map((p) => p.kcal).filter((k): k is number => typeof k === "number" && k > 0);
  const durs = past.map((p) => p.durationSec).filter((d): d is number => typeof d === "number" && d > 0);

  let text =
    w.kcalTotal !== null
      ? `${w.kcalActive} kcal en activité (${w.kcalTotal} au total, repos inclus)`
      : `${w.kcalActive} kcal en activité`;

  let gauge: WatchDebrief["gauge"] = null;
  if (kcals.length >= 3) {
    const min = Math.min(...kcals);
    const max = Math.max(...kcals);
    gauge = { min, max, value: w.kcalActive };
    if (w.kcalActive > max) text += ` : au-dessus de tes ${kcals.length} dernières séances (jusqu'à ${max})`;
    else if (w.kcalActive < min) text += ` : en dessous de tes ${kcals.length} dernières séances (à partir de ${min})`;
    else text += ` : tu restes dans ta fourchette habituelle (${min} à ${max})`;
  }
  text += ".";

  if (durs.length >= 3) {
    const min = Math.min(...durs);
    const max = Math.max(...durs);
    if (durationSec > max) text += ` Ta séance la plus longue de tes ${durs.length} dernières (${fmtDurationH(durationSec)}).`;
    else if (durationSec < min) text += ` Plus courte que tes ${durs.length} dernières séances (${fmtDurationH(durationSec)}).`;
    else text += ` Durée dans ta fourchette habituelle (${fmtDurationH(min)}–${fmtDurationH(max)}).`;
  }
  return { text, gauge };
}
