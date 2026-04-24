"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_KEYS } from "@/lib/demo-session";

const YEAR = 60 * 60 * 24 * 365;

export async function selectProgram(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;
  const jar = await cookies();
  jar.set(COOKIE_KEYS.program, slug, { path: "/", maxAge: YEAR, sameSite: "lax" });
  jar.set(COOKIE_KEYS.startDate, new Date().toISOString(), {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
  redirect("/dashboard");
}

export async function setFatigue(formData: FormData): Promise<void> {
  const scoreRaw = formData.get("score");
  if (scoreRaw === null) return;
  const score = Math.max(0, Math.min(10, Number(scoreRaw)));
  const jar = await cookies();
  jar.set(COOKIE_KEYS.fatigue, String(score), {
    path: "/",
    maxAge: 60 * 60 * 20, // expire 20h → refresh chaque matin
    sameSite: "lax",
  });
  redirect("/dashboard");
}

export async function resetDemo(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_KEYS.program);
  jar.delete(COOKIE_KEYS.fatigue);
  jar.delete(COOKIE_KEYS.startDate);
  redirect("/onboarding");
}
