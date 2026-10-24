"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { todayKey } from "@/lib/date-key";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { generateSessionCongrats, type HeartRateZoneSplit } from "@/lib/ecm-engine";
import { isSessionFeeling } from "@/lib/session-feeling";
import { MAX_SESSION_PHOTOS } from "@/lib/session-media";
import { advanceProgramPosition } from "@/lib/program-position";
import { effectiveWeekCycle } from "@/lib/week-overrides";

export type ResultKind = "strength" | "bodyweight" | "hold" | "carry" | "wod" | "warmup" | "endurance";

/** Un bloc de la séance, réalisé ou non — sert à lister TOUS les blocs sur la page "Séance terminée". */
export type BlocSummary = {
  bloc: number;
  titre: string;
  type: string;
  format?: string;
  /** Tous les mouvements cochés (ou bloc terminé). */
  done: boolean;
  items: { name: string; done: boolean; kind: ResultKind; /** Mouvement prévu quand celui-ci l'a remplacé (mission 11). */ replacedFrom?: string }[];
};

export type SessionBlocResult = {
  bloc: number;
  nom: string;
  series?: { charge: string; reps: string; rpe?: string; time?: string; unit?: "m" | "km" }[];
  /** Type de saisie du mouvement (page "Séance terminée") : détermine l'affichage 43 kg × 5, 20 reps, 32 kg × 40 m… */
  kind?: ResultKind;
  /** Cardio / endurance : ligne prête à afficher (distance · temps · allure · zone). */
  detail?: string;
  temps?: string;
  rounds?: string;
  score?: string;
  /** Version réellement réalisée d'un Metcon/Finisher (doc H.11). */
  rxScaled?: "rx" | "scaled";
  /** Mouvement prévu quand celui-ci l'a remplacé pendant la séance, et la raison (mission 11). */
  remplaceDe?: string;
  remplaceRaison?: string;
};

export type SessionResultPayload = {
  date: string;
  variant: "A" | "B";
  programSlug?: string;
  programDay?: number;
  blocs: SessionBlocResult[];
  summary?: BlocSummary[];
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
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
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
    data: { blocs: payload.blocs, summary: payload.summary ?? [] },
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

  // Suite ordonnée de séances (1.4) — best effort, ne bloque jamais la fin de séance.
  if (payload.programSlug && payload.programDay) {
    try {
      const profile = await prisma.profile.findUnique({ where: { userId }, select: { weekCycle: true } });
      await advanceProgramPosition({ userId, slug: payload.programSlug, doneDay: payload.programDay, weekCycle: await effectiveWeekCycle(userId, profile?.weekCycle, payload.date) });
    } catch (err) {
      console.error("saveSessionResult: position dans la suite non avancée:", err);
    }
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
  const [profile, checkin, dashboardOutput, previousOutputs, session] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.checkin.findUnique({ where: { userId_date: { userId, date: payload.date } } }),
    prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: payload.date } } }),
    // 3 derniers jours (mémoire courte du coach, doc A) — thèmes à ne pas répéter.
    prisma.dashboardOutput.findMany({
      where: { userId, date: { lt: payload.date } },
      orderBy: { date: "desc" },
      take: 3,
      select: { date: true, output: true },
    }),
    // Zones FC lues sur la photo ajoutée pendant la séance (doc E.b/E.c), si disponible.
    prisma.session.findUnique({ where: { userId_date: { userId, date: payload.date } }, select: { photoAnalysis: true } }),
  ]);
  // Pas de profil/checkin/dashboardOutput pour aujourd'hui = état incohérent
  // (ne devrait pas arriver, /session n'est accessible qu'après check-in) —
  // best effort, on abandonne silencieusement plutôt que de planter.
  if (!profile || !checkin || !dashboardOutput) return null;

  const previousMessage =
    (previousOutputs[0]?.output as { sessionMessage?: string } | null)?.sessionMessage ?? null;
  const recentTags = previousOutputs.map((o) => ({
    date: o.date,
    tags: ((o.output as { coachTags?: string[] } | null)?.coachTags ?? []) as string[],
  }));
  const heartRateZones =
    (session?.photoAnalysis as { heartRateZones?: HeartRateZoneSplit[] | null } | null)?.heartRateZones ?? null;
  const durationLabel = formatDurationLabel(payload.durationSec);

  const { message, tags } = await generateSessionCongrats({
    profile,
    checkin,
    sportLabel: checkin.seance || "Séance",
    durationLabel,
    previousMessage,
    recentTags,
    heartRateZones,
  });

  const existing = dashboardOutput.output as Record<string, unknown>;
  const existingTags = Array.isArray(existing.coachTags) ? (existing.coachTags as string[]) : [];
  const output = {
    ...existing,
    sessionMessage: message,
    sessionMessageDuration: durationLabel,
    // Les tags du mindset (généré le matin au check-in) restent — on ajoute
    // ceux du message de félicitations, sans les écraser.
    coachTags: [...existingTags, ...tags],
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
  /** "manuel" (saisie) ou "photo_auto" (lue sur la photo par Claude). */
  caloriesSource?: "manuel" | "photo_auto";
  photos?: string[];
  /** Analyse Claude de la photo : métriques brutes détectées + retour narratif. */
  photoAnalysis?: {
    donneesBrutes: Record<string, unknown> | null;
    retourNarratif: string | null;
    bpmMoyen?: number | null;
    heartRateZones?: HeartRateZoneSplit[] | null;
    /** Lues séparément sur la montre (page "Séance terminée"). */
    caloriesActivite?: number | null;
    caloriesTotales?: number | null;
    dureeMontre?: string | null;
  } | null;
};

export async function updateSessionRecap(date: string, patch: SessionRecapPatch): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };

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
    // Une montre ne renvoie jamais 20 000 kcal — on borne pour éviter les fautes de frappe.
    const clean =
      patch.calories === null || !Number.isFinite(patch.calories)
        ? null
        : Math.min(5000, Math.max(0, Math.round(patch.calories)));
    data.caloriesBrulees = clean;
    // Champ vidé → l'origine n'a plus de sens.
    data.caloriesSource = clean === null ? null : (patch.caloriesSource ?? "manuel");
  }
  if (patch.photos !== undefined) data.photos = patch.photos.slice(0, MAX_SESSION_PHOTOS);
  if (patch.photoAnalysis !== undefined) {
    data.photoAnalysis = patch.photoAnalysis ? (patch.photoAnalysis as Prisma.InputJsonValue) : Prisma.JsonNull;
  }
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

/**
 * Enregistre une activité de récupération (partie 4, mission 4) : aucune séance, aucun pourcentage.
 * Crée la séance du jour (situation B) ; si la journée a déjà une séance terminée, une activité
 * supplémentaire. Renvoie la page de fin d'activité à ouvrir.
 */
export async function saveRecoveryActivity(input: {
  durationMin: number;
  energy: number | null;
  feeling: string | null;
  seance: string;
}): Promise<{ ok: true; href: string } | { ok: false }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  const date = todayKey();
  const durationSec = Math.max(5, Math.round(input.durationMin)) * 60;
  const energy = input.energy !== null && input.energy >= 1 && input.energy <= 10 ? Math.round(input.energy) : null;
  const feeling = input.feeling && isSessionFeeling(input.feeling) ? input.feeling : null;
  const data = { recovery: true, ...(energy !== null ? { energie: energy } : {}) };
  try {
    const existing = await prisma.session.findUnique({ where: { userId_date: { userId, date } } });
    if (!existing?.completed) {
      await prisma.session.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, completed: true, data, durationSec, sessionFeeling: feeling },
        update: { completed: true, data, durationSec, sessionFeeling: feeling },
      });
      revalidatePath("/dashboard");
      return { ok: true, href: "/session/recap" };
    }
    const now = new Date();
    const extra = await prisma.extraActivity.create({
      data: {
        userId,
        date,
        seance: input.seance,
        heureReelle: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        completed: true,
        data,
        durationSec,
        sessionFeeling: feeling,
      },
    });
    revalidatePath("/dashboard");
    return { ok: true, href: `/session/extra/${extra.id}/recap` };
  } catch (err) {
    console.error("saveRecoveryActivity:", err);
    return { ok: false };
  }
}
