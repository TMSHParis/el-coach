"use server";

// 2e (ou 3e...) activité du jour (doc G.3) — table ExtraActivity séparée de
// Session (qui reste "la" séance principale du jour, identifiée par date).
// Une ExtraActivity est identifiée par son id, pas par date, puisqu'il peut
// y en avoir plusieurs le même jour.

import { Prisma } from "@prisma/client";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { isSessionFeeling } from "@/lib/session-feeling";
import { MAX_SESSION_PHOTOS } from "@/lib/session-media";
import type { SessionResultPayload, SessionRecapPatch, BestResult, SessionBlocResult } from "./actions";

function computeBestResult(blocs: SessionBlocResult[]): BestResult {
  let best: BestResult = null;
  for (const bloc of blocs) {
    for (const serie of bloc.series ?? []) {
      const charge = parseFloat(serie.charge);
      if (!Number.isFinite(charge) || charge <= 0) continue;
      if (!best || charge > best.charge) best = { nom: bloc.nom, charge, reps: serie.reps };
    }
  }
  return best;
}

/** Crée la 2e activité du jour — seule la séance choisie est demandée, pas
 * l'état du jour (déjà capté par le check-in du matin). */
export async function addExtraActivity(seance: string): Promise<{ ok: true; id: string } | { ok: false }> {
  const userId = await getUserId();
  if (!userId || !seance.trim()) return { ok: false };
  try {
    const row = await prisma.extraActivity.create({ data: { userId, date: todayKey(), seance: seance.trim() } });
    return { ok: true, id: row.id };
  } catch (err) {
    console.error("addExtraActivity: échec de la création:", err);
    return { ok: false };
  }
}

export async function getExtraActivity(id: string) {
  const userId = await getUserId();
  if (!userId) return null;
  const row = await prisma.extraActivity.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return row;
}

/** Même forme que saveSessionResult (Session) — signature compatible pour
 * être passée à SessionRunnerV2 via `.bind(null, id)`. */
export async function saveExtraActivityResult(
  id: string,
  payload: SessionResultPayload,
): Promise<{ ok: true; message: string | null } | { ok: false }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  const existing = await prisma.extraActivity.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { ok: false };

  try {
    await prisma.extraActivity.update({
      where: { id },
      data: {
        completed: true,
        data: { blocs: payload.blocs },
        completionRate: payload.completionRate ?? null,
        durationSec: payload.durationSec,
        bestResult: computeBestResult(payload.blocs) as Prisma.InputJsonValue,
      },
    });
    return { ok: true, message: null };
  } catch (err) {
    console.error("saveExtraActivityResult: échec de l'enregistrement:", err);
    return { ok: false };
  }
}

/** Même forme que updateSessionRecap (Session) — signature compatible pour
 * être passée à SessionRunnerV2 via `.bind(null, id)`. */
export async function updateExtraActivityRecap(id: string, _date: string, patch: SessionRecapPatch): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  const existing = await prisma.extraActivity.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { ok: false };

  const data: {
    sessionFeeling?: string;
    sessionNote?: string | null;
    caloriesBrulees?: number | null;
    caloriesSource?: string | null;
    photos?: string[];
    photoAnalysis?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  } = {};
  if (patch.feeling !== undefined) {
    if (!isSessionFeeling(patch.feeling)) return { ok: false };
    data.sessionFeeling = patch.feeling;
  }
  if (patch.note !== undefined) data.sessionNote = patch.note.trim().slice(0, 1000) || null;
  if (patch.calories !== undefined) {
    const clean =
      patch.calories === null || !Number.isFinite(patch.calories)
        ? null
        : Math.min(5000, Math.max(0, Math.round(patch.calories)));
    data.caloriesBrulees = clean;
    data.caloriesSource = clean === null ? null : (patch.caloriesSource ?? "manuel");
  }
  if (patch.photos !== undefined) data.photos = patch.photos.slice(0, MAX_SESSION_PHOTOS);
  if (patch.photoAnalysis !== undefined) {
    data.photoAnalysis = patch.photoAnalysis ? (patch.photoAnalysis as Prisma.InputJsonValue) : Prisma.JsonNull;
  }
  if (Object.keys(data).length === 0) return { ok: true };

  try {
    await prisma.extraActivity.update({ where: { id }, data });
    return { ok: true };
  } catch (err) {
    console.error("updateExtraActivityRecap: échec de l'enregistrement:", err);
    return { ok: false };
  }
}
