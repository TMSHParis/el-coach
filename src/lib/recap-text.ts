// Textes de la page "Séance terminée" (mission B). Tout est calculé à partir de
// données connues : aucune phrase n'affirme ce que l'app ne mesure pas, et
// chaque comparaison (fourchette, durée) n'est écrite qu'après vérification.

import { makeT, type DictKey, type Translate } from "@/lib/i18n";
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
export function fmtSerie(s: SerieLike, kind: string | undefined, t: Translate = makeT("fr")): string | null {
  const charge = parseFloat(s.charge);
  const hasCharge = Number.isFinite(charge) && charge > 0;
  const reps = s.reps?.trim();
  if (kind === "endurance") return s.time?.trim() || null;
  if (kind === "hold" || (!reps && (s.time?.trim() || s.timeD?.trim()))) {
    const g = s.time?.trim();
    const d = s.timeD?.trim();
    if (!g && !d) return null;
    const txt = d ? t("sp.rt.sides", { g: g || "—", d }) : (g as string);
    return hasCharge ? `${txt} · +${charge} kg` : txt;
  }
  if (kind === "carry") {
    if (!reps) return hasCharge ? `${charge} kg` : null;
    const unit = s.unit ?? "m";
    return hasCharge ? `${charge} kg × ${reps} ${unit}` : `${reps} ${unit}`;
  }
  if (hasCharge) return reps ? `${charge} kg × ${reps}` : `${charge} kg`;
  return reps ? t("sp.rt.reps", { n: reps }) : null;
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
export function buildRecapBlocs(summary: BlocSummary[] | undefined, results: SessionBlocResult[], t: Translate = makeT("fr")): RecapBloc[] {
  const wodLineFor = (r: SessionBlocResult | undefined): string | null => {
    if (!r) return null;
    const parts = [r.temps && r.temps, r.rounds && t("sp.rt.rounds", { n: r.rounds }), r.score && t("sp.rt.bonusReps", { n: r.score })].filter(Boolean);
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
        titre: wod?.nom ?? t("sp.rt.blocN", { n: bloc }),
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
export function blocKeyResult(b: RecapBloc, t: Translate = makeT("fr")): string | null {
  if (WARMUP_TYPES.includes(b.type)) return b.format ?? null;
  if (b.wodLine) return b.wodLine;
  let best: { name: string; text: string; score: number } | null = null;
  for (const it of b.items) {
    if (it.series.length === 0) continue;
    const i = bestSerieIndex(it.series);
    const text = fmtSerie(it.series[i], it.kind, t);
    if (!text) continue;
    const score = serieScore(it.series[i]);
    if (!best || score > best.score) best = { name: it.name, text, score };
  }
  if (!best) return null;
  return b.items.length === 1 ? t("sp.rt.bestSet", { x: best.text }) : `${best.name} : ${best.text}`;
}

export type MissingEntry = { bloc: string; elements: string[] };

/** Ce qui manque : mouvements non cochés, groupés par bloc (vide si 100 %). */
export function missingEntries(blocs: RecapBloc[]): MissingEntry[] {
  return blocs
    .map((b) => ({ bloc: b.titre, elements: b.items.filter((i) => !i.done).map((i) => i.name) }))
    .filter((e) => e.elements.length > 0);
}

/** Valeur stockée du mental (sans emoji, minuscule) → clé de mot : clair, moyen, brouillard. */
const MENTAL_KEYS = ["clair", "moyen", "brouillard"] as const;
function mentalKey(mental: string | null | undefined): (typeof MENTAL_KEYS)[number] | null {
  const k = (mental ?? "").replace(/[^\p{L}]/gu, "").toLowerCase();
  return (MENTAL_KEYS as readonly string[]).includes(k) ? (k as (typeof MENTAL_KEYS)[number]) : null;
}

/** « Mental clair » pour la pastille de la page de fin d'activité — null si non renseigné. */
export function mentalLabel(mental: string | null | undefined, t: Translate = makeT("fr")): string | null {
  const k = mentalKey(mental);
  return k ? t(`sp.rt.mental.${k}` as DictKey) : null;
}

/**
 * Message du coach pour une activité libre (situation B) : positif, appuyé sur la durée et l'énergie,
 * jamais de pourcentage.
 */
export function freeActivityMessage(
  input: { prenom: string; durationSec: number; energie: number | null; recuperation?: boolean },
  t: Translate = makeT("fr"),
): string {
  const who = input.prenom ? `${input.prenom}, ` : "";
  const energy = input.energie !== null ? t("sp.rt.energy", { e: input.energie }) : "";
  if (input.recuperation) {
    const min = Math.max(1, Math.round(input.durationSec / 60));
    return t("sp.rt.freeRecup", { who, min, energy });
  }
  return t("sp.rt.freeActivity", { who, dur: fmtDurationH(input.durationSec), energy });
}

export function coachMessage(
  input: {
    prenom: string;
    durationSec: number;
    percent: number;
    energie: number | null;
    mental: string | null;
    best: { nom: string; charge: number; reps: string } | null;
    wod: { titre: string; temps: string } | null;
  },
  t: Translate = makeT("fr"),
): string {
  const mk = mentalKey(input.mental);
  const mental = mk ? t(`sp.rt.mw.${mk}` as DictKey) : null;
  let first = `${input.prenom}, ${fmtDurationH(input.durationSec)}`;
  if (input.energie !== null) first += t("sp.rt.energy", { e: input.energie });
  if (mental) first += t(input.energie !== null ? "sp.rt.mentalAnd" : "sp.rt.mentalWith", { m: mental });
  first += input.percent >= 70 ? t("sp.rt.endGood") : t("sp.rt.endPct", { p: input.percent });

  const parts = [first];
  if (input.best) {
    const reps = input.best.reps ? ` × ${input.best.reps}` : "";
    parts.push(t("sp.rt.bestLift", { nom: input.best.nom, charge: input.best.charge, reps }));
  }
  if (input.wod) parts.push(t("sp.rt.wod", { titre: input.wod.titre, temps: input.wod.temps }));
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
  t: Translate = makeT("fr"),
): WatchDebrief {
  if (w.kcalActive === null) return { text: null, gauge: null };
  const kcals = past.map((p) => p.kcal).filter((k): k is number => typeof k === "number" && k > 0);
  const durs = past.map((p) => p.durationSec).filter((d): d is number => typeof d === "number" && d > 0);

  let text =
    w.kcalTotal !== null
      ? t("sp.rt.watch.kcalTotal", { a: w.kcalActive, b: w.kcalTotal })
      : t("sp.rt.watch.kcal", { a: w.kcalActive });

  let gauge: WatchDebrief["gauge"] = null;
  if (kcals.length >= 3) {
    const min = Math.min(...kcals);
    const max = Math.max(...kcals);
    gauge = { min, max, value: w.kcalActive };
    if (w.kcalActive > max) text += t("sp.rt.watch.above", { n: kcals.length, max });
    else if (w.kcalActive < min) text += t("sp.rt.watch.below", { n: kcals.length, min });
    else text += t("sp.rt.watch.within", { min, max });
  }
  text += ".";

  if (durs.length >= 3) {
    const min = Math.min(...durs);
    const max = Math.max(...durs);
    if (durationSec > max) text += t("sp.rt.dur.longest", { n: durs.length, d: fmtDurationH(durationSec) });
    else if (durationSec < min) text += t("sp.rt.dur.shorter", { n: durs.length, d: fmtDurationH(durationSec) });
    else text += t("sp.rt.dur.within", { min: fmtDurationH(min), max: fmtDurationH(max) });
  }
  return { text, gauge };
}
