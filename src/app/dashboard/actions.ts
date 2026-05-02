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
  jar.delete(COOKIE_KEYS.weekOrder);
  redirect("/onboarding");
}

const DEFAULT_ORDER = [1, 2, 3, 4, 5, 6, 7];

async function readOrder(): Promise<number[]> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_KEYS.weekOrder)?.value;
  if (!raw) return [...DEFAULT_ORDER];
  const parsed = raw.split(",").map((n) => parseInt(n, 10));
  if (parsed.length === 7 && parsed.every((n) => n >= 1 && n <= 7) && new Set(parsed).size === 7) {
    return parsed;
  }
  return [...DEFAULT_ORDER];
}

async function writeOrder(order: number[]): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_KEYS.weekOrder, order.join(","), {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
}

export async function moveDay(formData: FormData): Promise<void> {
  const dayRaw = formData.get("day");
  const dirRaw = formData.get("direction"); // "up" | "down"
  if (!dayRaw || !dirRaw) return;
  const day = Number(dayRaw);
  const dir = String(dirRaw);

  const order = await readOrder();
  const idx = order.indexOf(day);
  if (idx === -1) return;
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= order.length) return;
  [order[idx], order[target]] = [order[target], order[idx]];
  await writeOrder(order);
  redirect("/dashboard");
}

export async function resetWeekOrder(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_KEYS.weekOrder);
  redirect("/dashboard");
}
