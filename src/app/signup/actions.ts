"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Profile } from "@prisma/client";
import { COOKIE_KEYS } from "@/lib/demo-session";
import { getTemplate } from "@/lib/programming";
import { prisma } from "@/lib/prisma";
import { ensureUserId } from "@/lib/user-id";
import { clerkEnabled } from "@/lib/clerk";

const YEAR = 60 * 60 * 24 * 365;

const COOKIE_SIGNUP = "el_coach_signup";
const COOKIE_PROFILE = "el_coach_profile";

export type SignupCookie = {
  firstName: string;
  lastName: string;
  email: string;
  programSlug: string;
  cardLast4?: string;
  trialEndsAt?: string; // ISO date
};

export type ProfileCookie = {
  birthDate?: string;
  gender?: "M" | "F" | "X";
  weightKg?: number;
  heightCm?: number;
  level?: "beginner" | "intermediate" | "expert";
  rm?: Record<string, number>;
  completedAt?: string;
};

async function readSignupCookie(): Promise<SignupCookie | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_SIGNUP)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SignupCookie;
  } catch {
    return null;
  }
}

async function writeSignupCookie(data: SignupCookie): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_SIGNUP, JSON.stringify(data), {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
}

export async function submitAccountStep(formData: FormData): Promise<void> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const programSlug = String(formData.get("programSlug") ?? "").trim();

  if (!firstName || !lastName || !email || password.length < 6) {
    redirect("/signup?error=invalid&step=1");
  }

  const existing = (await readSignupCookie()) ?? {
    firstName: "",
    lastName: "",
    email: "",
    programSlug: "",
  };

  await writeSignupCookie({
    ...existing,
    firstName,
    lastName,
    email,
    // Le programme peut être pré-sélectionné depuis Free Trial.
    programSlug: programSlug || existing.programSlug,
  });

  redirect("/signup?step=2");
}

export async function submitProgramStep(formData: FormData): Promise<void> {
  const programSlug = String(formData.get("programSlug") ?? "").trim();
  if (!programSlug) redirect("/signup?error=invalid&step=2");

  const existing = await readSignupCookie();
  if (!existing) redirect("/signup?step=1");

  await writeSignupCookie({ ...existing, programSlug });
  redirect("/signup?step=3");
}

export async function submitPaymentStep(formData: FormData): Promise<void> {
  const cardNumber = String(formData.get("cardNumber") ?? "").replace(/\s/g, "");
  const acceptCgv = formData.get("cgv") === "on";

  if (cardNumber.length < 12 || !acceptCgv) {
    redirect("/signup?error=invalid&step=3");
  }

  const existing = await readSignupCookie();
  if (!existing) redirect("/signup?step=1");

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  await writeSignupCookie({
    ...existing,
    cardLast4: cardNumber.slice(-4),
    trialEndsAt: trialEnd.toISOString(),
  });

  // Active la programmation choisie pour l'utilisateur démo (cookie existant).
  const jar = await cookies();
  jar.set(COOKIE_KEYS.program, existing.programSlug, {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
  jar.set(COOKIE_KEYS.startDate, new Date().toISOString(), {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });

  redirect("/signup/success");
}

// ============================================================================
// Profil post-inscription
// ============================================================================

async function readProfileCookie(): Promise<ProfileCookie | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_PROFILE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProfileCookie;
  } catch {
    return null;
  }
}

async function writeProfileCookie(data: ProfileCookie): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_PROFILE, JSON.stringify(data), {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
}

export async function submitProfileStep(formData: FormData): Promise<void> {
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim() as ProfileCookie["gender"];
  const weightKg = Number(formData.get("weightKg") ?? 0);
  const heightCm = Number(formData.get("heightCm") ?? 0);

  const existing = (await readProfileCookie()) ?? {};
  await writeProfileCookie({ ...existing, birthDate, gender, weightKg, heightCm });
  redirect("/signup/profile?step=2");
}

export async function submitLevelStep(formData: FormData): Promise<void> {
  const level = String(formData.get("level") ?? "").trim() as ProfileCookie["level"];
  const existing = (await readProfileCookie()) ?? {};
  await writeProfileCookie({ ...existing, level });
  redirect("/signup/profile?step=3");
}

export async function submitRmStep(formData: FormData): Promise<void> {
  const existing = (await readProfileCookie()) ?? {};
  const rm: Record<string, number> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("rm.")) {
      const lift = key.slice(3);
      const num = Number(value);
      if (num > 0) rm[lift] = num;
    }
  }
  await writeProfileCookie({ ...existing, rm });
  redirect("/signup/profile?step=4");
}

export async function submitConfirmStep(): Promise<void> {
  const existing = (await readProfileCookie()) ?? {};
  await writeProfileCookie({ ...existing, completedAt: new Date().toISOString() });
  redirect("/dashboard");
}

export async function getSignupState(): Promise<SignupCookie | null> {
  return readSignupCookie();
}

export async function getProfileState(): Promise<ProfileCookie | null> {
  return readProfileCookie();
}

// ============================================================================
// ECM Signup — flow unifié compte + profil complet + paiement (mai 2026)
// ============================================================================

const COOKIE_ECM_PROFILE = "el_coach_ecm_profile";

export type EcmSport = { nom: string; jours: string[]; h: string; du: string; niv: string };

export type EcmProfileCookie = {
  prenom: string;
  age: string;
  taille: string;
  poids: string;
  /** 0 à 2 objectifs sélectionnés — persistés en objectif_1 / objectif_2. */
  obj: string[];
  s1: EcmSport;
  s2: EcmSport;
  s2on: boolean;
  equip: string;
  jeune: boolean | null;
  tj: string;
  df: string;
  ff: string;
  rest: string[];
  hydra: string;
  bles: boolean | null;
  bt: string;
  comp: string[];
  ca: string;
  qs: string;
  ds: string;
};

export type EcmSignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  programSlug: string;
  profile: EcmProfileCookie;
  cardNumber: string;
};

export async function submitEcmSignup(
  payload: EcmSignupPayload,
): Promise<{ ok: true; firstName: string } | { ok: false; error: string }> {
  const { firstName, lastName, email, programSlug, profile, cardNumber } = payload;

  if (!firstName || !email.includes("@")) {
    return { ok: false, error: "Vérifie tes informations et réessaie." };
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  await writeSignupCookie({
    firstName,
    lastName,
    email,
    programSlug,
    cardLast4: cardNumber.replace(/\s/g, "").slice(-4),
    trialEndsAt: trialEnd.toISOString(),
  });

  const jar = await cookies();
  jar.set(COOKIE_ECM_PROFILE, JSON.stringify(profile), {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });

  // N'active la programmation dashboard que si elle correspond à une base
  // EL COACH METHOD connue (les sports hors catalogue restent en profil seul).
  if (programSlug && getTemplate(programSlug)) {
    jar.set(COOKIE_KEYS.program, programSlug, { path: "/", maxAge: YEAR, sameSite: "lax" });
    jar.set(COOKIE_KEYS.startDate, new Date().toISOString(), {
      path: "/",
      maxAge: YEAR,
      sameSite: "lax",
    });
  }

  // Persistance réelle (Postgres) — best effort : une erreur ici ne doit pas
  // bloquer le signup, l'utilisateur reste en mode cookie/démo dans ce cas.
  try {
    await persistEcmProfile(profile);
  } catch (err) {
    console.error("submitEcmSignup: persistance du profil échouée:", err);
  }

  return { ok: true, firstName };
}

async function persistEcmProfile(profile: EcmProfileCookie): Promise<void> {
  const userId = await ensureUserId();

  const data = {
    prenom: profile.prenom,
    age: parseInt(profile.age, 10) || 0,
    taille: parseInt(profile.taille, 10) || 0,
    poids: parseFloat(profile.poids) || 0,
    objectif: profile.obj[0] ?? "",
    objectif2: profile.obj[1] || null,
    programme: profile.s1.nom,
    niveau: profile.s1.niv,
    sportPrincipal: profile.s1.nom,
    sportSecondaire: profile.s2on ? profile.s2.nom : null,
    joursS1: profile.s1.jours,
    heureS1: profile.s1.h,
    dureeS1: profile.s1.du,
    niveauS1: profile.s1.niv,
    joursS2: profile.s2on ? profile.s2.jours : [],
    heureS2: profile.s2on ? profile.s2.h : null,
    dureeS2: profile.s2on ? profile.s2.du : null,
    niveauS2: profile.s2on ? profile.s2.niv : null,
    equipement: profile.equip,
    jeune: profile.jeune ?? false,
    typeJeune: profile.tj || null,
    debutFenetre: profile.df || null,
    finFenetre: profile.ff || null,
    restrictions: profile.rest,
    hydratation: profile.hydra,
    blessures: profile.bles ?? false,
    blessuresDetail: profile.bt || null,
    complements: profile.comp,
    complementsAutres: profile.ca || null,
    qualiteSommeil: profile.qs,
    dureeSommeil: profile.ds,
  };

  // Vérification demandée par Kamel : confirmer en prod (logs Vercel) qu'aucun
  // champ n'arrive null/undefined par erreur avant l'écriture en base.
  console.log("[persistEcmProfile] payload →", data);

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function getEcmProfileState(): Promise<EcmProfileCookie | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_ECM_PROFILE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EcmProfileCookie;
  } catch {
    return null;
  }
}

// ============================================================================
// Édition de profil — onglet "J'ai changé" (compte déjà créé via Clerk).
// ============================================================================

function profileRowToCookie(row: Profile): EcmProfileCookie {
  return {
    prenom: row.prenom,
    age: String(row.age),
    taille: String(row.taille),
    poids: String(row.poids),
    obj: [row.objectif, row.objectif2].filter((v): v is string => Boolean(v)),
    s1: {
      nom: row.sportPrincipal,
      jours: row.joursS1,
      h: row.heureS1,
      du: row.dureeS1,
      niv: row.niveauS1,
    },
    s2: {
      nom: row.sportSecondaire ?? "",
      jours: row.joursS2,
      h: row.heureS2 ?? "",
      du: row.dureeS2 ?? "",
      niv: row.niveauS2 ?? "",
    },
    s2on: Boolean(row.sportSecondaire),
    equip: row.equipement,
    jeune: row.jeune,
    tj: row.typeJeune ?? "",
    df: row.debutFenetre ?? "",
    ff: row.finFenetre ?? "",
    rest: row.restrictions,
    hydra: row.hydratation,
    bles: row.blessures,
    bt: row.blessuresDetail ?? "",
    comp: row.complements,
    ca: row.complementsAutres ?? "",
    qs: row.qualiteSommeil,
    ds: row.dureeSommeil,
  };
}

/** Profil de l'utilisateur Clerk connecté, pour préremplir l'onglet "J'ai changé". */
export async function getMyEcmProfile(): Promise<EcmProfileCookie | null> {
  if (!clerkEnabled) return null;
  const session = await auth();
  if (!session.userId) return null;
  const row = await prisma.profile.findUnique({ where: { userId: session.userId } });
  return row ? profileRowToCookie(row) : null;
}

/** Upsert du profil — n'autorise que les utilisateurs réellement connectés via Clerk. */
export async function updateEcmProfile(
  profile: EcmProfileCookie,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!clerkEnabled) return { ok: false, error: "Connexion requise." };
  const session = await auth();
  if (!session.userId) return { ok: false, error: "Connecte-toi d'abord." };
  await persistEcmProfile(profile);
  return { ok: true };
}
