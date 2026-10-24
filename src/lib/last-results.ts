// Dernier résultat connu par mouvement — alimente le rappel "dernière fois :
// 100 kg × 5" et la charge suggérée, sur /session comme sur le compte rendu.

import { LEGACY_MOVEMENT_NAMES } from "./movements";

export type LastResult = {
  date: string;
  charge: number;
  reps: string;
  /** Charge proposée pour aujourd'hui (+2,5 kg quand on peut). */
  suggestion: number;
  /** Gainage : meilleur temps tenu de la dernière séance (« 0:45 »). */
  time?: string;
};

type StoredSerie = { charge?: string; reps?: string; time?: string };
type StoredBloc = { nom?: string; series?: StoredSerie[] };
type SessionRow = { date: string; data: unknown };

/** Palier de progression : +2,5 kg, l'incrément d'une paire de petits disques. */
const STEP_KG = 2.5;

export function buildLastResults(sessions: SessionRow[]): Record<string, LastResult> {
  const out: Record<string, LastResult> = {};
  // Les séances arrivent de la plus récente à la plus ancienne : le premier
  // résultat trouvé pour un mouvement est le bon, on ne l'écrase pas ensuite.
  for (const session of sessions) {
    const blocs = (session.data as { blocs?: StoredBloc[] } | null)?.blocs ?? [];
    for (const bloc of blocs) {
      const rawNom = bloc.nom?.trim();
      // Résultats enregistrés sous un ancien nom français : on les rattache au nom anglais.
      const nom = rawNom ? (LEGACY_MOVEMENT_NAMES[rawNom] ?? rawNom) : rawNom;
      if (!nom || out[nom] || !bloc.series?.length) continue;
      const best = bloc.series
        .map((s) => ({ charge: parseFloat(String(s.charge ?? "")), reps: String(s.reps ?? "") }))
        .filter((s) => Number.isFinite(s.charge) && s.charge > 0)
        .sort((a, b) => b.charge - a.charge)[0];
      if (!best) {
        // Gainage : aucune charge, un temps tenu — on garde le plus long.
        const toSec = (t: string) => {
          const m = t.match(/^(\d+):(\d{2})$/);
          return m ? Number(m[1]) * 60 + Number(m[2]) : parseFloat(t) || 0;
        };
        const longest = bloc.series.map((x) => String(x.time ?? "").trim()).filter(Boolean).sort((a, b) => toSec(b) - toSec(a))[0];
        if (longest) out[nom] = { date: session.date, charge: 0, reps: "", suggestion: 0, time: longest };
        continue;
      }
      out[nom] = {
        date: session.date,
        charge: best.charge,
        reps: best.reps,
        suggestion: Math.round((best.charge + STEP_KG) * 2) / 2,
      };
    }
  }
  return out;
}
