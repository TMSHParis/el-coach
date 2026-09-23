"use server";

import type { Prisma } from "@prisma/client";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { generateSessionCongrats } from "@/lib/ecm-engine";
import { isSessionFeeling } from "@/lib/session-feeling";
import { MAX_SESSION_PHOTOS } from "@/lib/session-media";

export type SessionBlocResult = {
  bloc: number;
  nom: string;
  series?: { charge: string; reps: string; rpe?: string }[];
  temps?: string;
  rounds?: string;
  score?: string;
};

export type SessionResultPayload = {
  date: string;
  variant: "A" | "B";
  blocs: SessionBlocResult[];
  /** Durée totale de la séance (secondes) — sert au message de félicitations. */
  durationSec: number;
  /** Part des mouvements cochés (0 à 1). */
  completionRate?: number;
};

/** Meilleure série du jour — mise en avant sur le compte rendu. */
export type BestResult = { nom: string; charge: number; reps: string } | null;

/** Meilleure série (charge la plus lourde) parmi les résultats saisis. */
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

function formatDurationLabel(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}H${String(m).padStart(2, "0")}`;
  return `${m} MIN`;
}

/** Enregistre les résultats de la séance terminée — best effort, ne bloque jamais la fin de séance côté UI. */
export async function saveSessionResult(
  payload: SessionResultPayload,
): Promise<{ ok: true; message: string | null } | { ok: false }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  const row = {
    variant: payload.variant,
    completed: true,
    data: { blocs: payload.blocs },
    completionRate: payload.completionRate ?? null,
    durationSec: payload.durationSec,
    bestResult: computeBestResult(payload.blocs) as Prisma.InputJsonValue,
  };
  try {
    await prisma.session.upsert({
      where: { userId_date: { userId, date: payload.date } },
      create: { userId, date: payload.date, ...row },
      update: row,
    });
  } catch (err) {
    console.error("saveSessionResult: échec de l'enregistrement de la séance:", err);
    return { ok: false };
  }

  // Message de félicitations — best effort, une erreur ici ne doit jamais
  // empêcher l'écran de fin de séance de s'afficher (il est aussi affiché sur
  // le dashboard, où il est stocké avec le plan du jour).
  try {
    return { ok: true, message: await generateAndStoreCongrats(userId, payload) };
  } catch (err) {
    console.error("saveSessionResult: échec de la génération du message de félicitations:", err);
    return { ok: true, message: null };
  }
}

async function generateAndStoreCongrats(userId: string, payload: SessionResultPayload): Promise<string | null> {
  const [profile, checkin, dashboardOutput, previousOutput] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.checkin.findUnique({ where: { userId_date: { userId, date: payload.date } } }),
    prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: payload.date } } }),
    prisma.dashboardOutput.findFirst({
      where: { userId, date: { lt: payload.date } },
      orderBy: { date: "desc" },
      select: { output: true },
    }),
  ]);
  // Pas de profil/checkin/dashboardOutput pour aujourd'hui = état incohérent
  // (ne devrait pas arriver, /session n'est accessible qu'après check-in) —
  // best effort, on abandonne silencieusement plutôt que de planter.
  if (!profile || !checkin || !dashboardOutput) return null;

  const previousMessage = (previousOutput?.output as { sessionMessage?: string } | null)?.sessionMessage ?? null;
  const durationLabel = formatDurationLabel(payload.durationSec);

  const message = await generateSessionCongrats({
    profile,
    checkin,
    sportLabel: checkin.seance || "Séance",
    durationLabel,
    previousMessage,
  });

  const output = {
    ...(dashboardOutput.output as Record<string, unknown>),
    sessionMessage: message,
    sessionMessageDuration: durationLabel,
  };
  await prisma.dashboardOutput.update({
    where: { userId_date: { userId, date: payload.date } },
    data: { output: output as Prisma.InputJsonValue },
  });
  return message;
}


/**
 * Compte rendu de séance : ressenti, note libre, calories relevées sur la
 * montre et photos. Chaque champ est facultatif — seuls ceux fournis sont
 * écrits, l'écran enregistre au fil de la saisie.
 */
export type SessionRecapPatch = {
  feeling?: string;
  note?: string;
  calories?: number | null;
  photos?: string[];
};

export async function updateSessionRecap(date: string, patch: SessionRecapPatch): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };

  const data: {
    sessionFeeling?: string;
    sessionNote?: string | null;
    caloriesBrulees?: number | null;
    photos?: string[];
  } = {};
  if (patch.feeling !== undefined) {
    if (!isSessionFeeling(patch.feeling)) return { ok: false };
    data.sessionFeeling = patch.feeling;
  }
  if (patch.note !== undefined) data.sessionNote = patch.note.trim().slice(0, 1000) || null;
  if (patch.calories !== undefined) {
    // Une montre ne renvoie jamais 20 000 kcal — on borne pour éviter les fautes de frappe.
    data.caloriesBrulees =
      patch.calories === null || !Number.isFinite(patch.calories)
        ? null
        : Math.min(5000, Math.max(0, Math.round(patch.calories)));
  }
  if (patch.photos !== undefined) data.photos = patch.photos.slice(0, MAX_SESSION_PHOTOS);
  if (Object.keys(data).length === 0) return { ok: true };

  try {
    // upsert : les photos peuvent être ajoutées pendant la séance, avant que la
    // ligne ne soit créée par `saveSessionResult` à la fin.
    await prisma.session.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...data },
      update: data,
    });
    return { ok: true };
  } catch (err) {
    console.error("updateSessionRecap: échec de l'enregistrement du compte rendu:", err);
    return { ok: false };
  }
}
