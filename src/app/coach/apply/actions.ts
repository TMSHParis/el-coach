"use server";

import { redirect } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";

export type CoachApplication = {
  id: string;
  submittedAt: string;
  profile: {
    fullName: string;
    handle: string;
    email: string;
    title: string;
    bio: string;
    location: string;
    yearsExp: number;
    specialties: string[];
    instagram?: string;
    website?: string;
  };
  program: {
    title: string;
    category: string;
    level: string;
    weeks: number;
    sessionsPerWeek: number;
    priceCents: number;
    description: string;
    outcomes: string[];
    equipment: string[];
  };
};

export type ApplyFormState =
  | { ok: true; id: string }
  | { ok: false; errors: Record<string, string> };

function req(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function csv(fd: FormData, key: string): string[] {
  return req(fd, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function submitCoachApplication(
  _prev: ApplyFormState | undefined,
  fd: FormData,
): Promise<ApplyFormState> {
  const errors: Record<string, string> = {};
  const fullName = req(fd, "fullName");
  const handle = req(fd, "handle");
  const email = req(fd, "email");
  const title = req(fd, "title");
  const bio = req(fd, "bio");
  const location = req(fd, "location");
  const yearsExp = Number(req(fd, "yearsExp") || "0");
  const specialties = csv(fd, "specialties");

  if (fullName.length < 2) errors.fullName = "Nom requis";
  if (!/^@?[\w.-]{2,}$/.test(handle)) errors.handle = "Handle invalide";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Email invalide";
  if (title.length < 3) errors.title = "Titre requis";
  if (bio.length < 40) errors.bio = "Bio trop courte (40 caractères min)";
  if (location.length < 2) errors.location = "Localisation requise";
  if (!Number.isFinite(yearsExp) || yearsExp < 0 || yearsExp > 60)
    errors.yearsExp = "Années d'expérience invalide";
  if (specialties.length === 0) errors.specialties = "Au moins une spécialité";

  const pTitle = req(fd, "pTitle");
  const pCategory = req(fd, "pCategory");
  const pLevel = req(fd, "pLevel");
  const pWeeks = Number(req(fd, "pWeeks") || "0");
  const pSessions = Number(req(fd, "pSessions") || "0");
  const pPrice = Number(req(fd, "pPrice") || "0");
  const pDescription = req(fd, "pDescription");
  const pOutcomes = csv(fd, "pOutcomes");
  const pEquipment = csv(fd, "pEquipment");

  const cats = ["STRENGTH", "HYPERTROPHY", "CONDITIONING", "ENDURANCE", "MOBILITY"];
  const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

  if (pTitle.length < 3) errors.pTitle = "Titre programme requis";
  if (!cats.includes(pCategory)) errors.pCategory = "Catégorie invalide";
  if (!levels.includes(pLevel)) errors.pLevel = "Niveau invalide";
  if (pWeeks < 1 || pWeeks > 52) errors.pWeeks = "Durée invalide (1-52)";
  if (pSessions < 1 || pSessions > 14) errors.pSessions = "Fréquence invalide (1-14)";
  if (pPrice < 5 || pPrice > 500) errors.pPrice = "Prix invalide (5€-500€)";
  if (pDescription.length < 60) errors.pDescription = "Description trop courte (60 car. min)";
  if (pOutcomes.length === 0) errors.pOutcomes = "Au moins un résultat attendu";
  if (pEquipment.length === 0) errors.pEquipment = "Au moins un matériel";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const app: CoachApplication = {
    id: `CA-${Date.now().toString(36).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
    profile: {
      fullName,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      email,
      title,
      bio,
      location,
      yearsExp,
      specialties,
      instagram: req(fd, "instagram") || undefined,
      website: req(fd, "website") || undefined,
    },
    program: {
      title: pTitle,
      category: pCategory,
      level: pLevel,
      weeks: pWeeks,
      sessionsPerWeek: pSessions,
      priceCents: Math.round(pPrice * 100),
      description: pDescription,
      outcomes: pOutcomes,
      equipment: pEquipment,
    },
  };

  await persistApplication(app);
  redirect(`/coach/apply/thanks?id=${app.id}`);
}

async function persistApplication(app: CoachApplication) {
  if (process.env.VERCEL) {
    console.log("[coach-application]", JSON.stringify(app));
    return;
  }
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "applications.json");
  let existing: CoachApplication[] = [];
  try {
    existing = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  existing.push(app);
  await fs.writeFile(file, JSON.stringify(existing, null, 2));
}
