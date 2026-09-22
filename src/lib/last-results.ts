// Dernier résultat connu par mouvement — alimente le rappel "dernière fois :
// 100 kg × 5" et la charge suggérée, sur /session comme sur le compte rendu.

export type LastResult = {
  date: string;
  charge: number;
  reps: string;
  /** Charge proposée pour aujourd'hui (+2,5 kg quand on peut). */
  suggestion: number;
};

type StoredSerie = { charge?: string; reps?: string };
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
      const nom = bloc.nom?.trim();
      if (!nom || out[nom] || !bloc.series?.length) continue;
      const best = bloc.series
        .map((s) => ({ charge: parseFloat(String(s.charge ?? "")), reps: String(s.reps ?? "") }))
        .filter((s) => Number.isFinite(s.charge) && s.charge > 0)
        .sort((a, b) => b.charge - a.charge)[0];
      if (!best) continue;
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
