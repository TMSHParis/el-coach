"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_KEYS } from "@/lib/demo-session";

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
