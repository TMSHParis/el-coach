import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "./clerk";

const COOKIE_UID = "el_coach_uid";
const YEAR = 60 * 60 * 24 * 365;

/** Lecture seule — utilisable dans les Server Components (dashboard, etc.). */
export async function getUserId(): Promise<string | null> {
  if (clerkEnabled) {
    const session = await auth();
    if (session.userId) return session.userId;
  }
  const jar = await cookies();
  return jar.get(COOKIE_UID)?.value ?? null;
}

/**
 * Crée l'identifiant démo si besoin — n'appeler que depuis une Server Action
 * ou un Route Handler (écrit un cookie, interdit dans un Server Component).
 */
export async function ensureUserId(): Promise<string> {
  if (clerkEnabled) {
    const session = await auth();
    if (session.userId) return session.userId;
  }
  const jar = await cookies();
  const existing = jar.get(COOKIE_UID)?.value;
  if (existing) return existing;

  const id = `demo_${crypto.randomUUID()}`;
  jar.set(COOKIE_UID, id, { path: "/", maxAge: YEAR, sameSite: "lax" });
  return id;
}
