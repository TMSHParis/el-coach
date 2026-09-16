"use server";

import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";

export type SessionBlocResult = {
  bloc: number;
  nom: string;
  series?: { charge: string; reps: string }[];
  temps?: string;
  rounds?: string;
  score?: string;
};

export type SessionResultPayload = {
  date: string;
  variant: "A" | "B";
  blocs: SessionBlocResult[];
};

/** Enregistre les résultats de la séance terminée — best effort, ne bloque jamais la fin de séance côté UI. */
export async function saveSessionResult(payload: SessionResultPayload): Promise<{ ok: true } | { ok: false }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  try {
    await prisma.session.upsert({
      where: { userId_date: { userId, date: payload.date } },
      create: { userId, date: payload.date, variant: payload.variant, completed: true, data: { blocs: payload.blocs } },
      update: { variant: payload.variant, completed: true, data: { blocs: payload.blocs } },
    });
    return { ok: true };
  } catch (err) {
    console.error("saveSessionResult: échec de l'enregistrement:", err);
    return { ok: false };
  }
}
