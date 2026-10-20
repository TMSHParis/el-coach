"use server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user-id";
import { CHAINS, type ChainId } from "@/lib/chains";

/** Monte d'un cran dans une chaîne de progression At Home (proposé sur « Séance terminée »). */
export async function upgradeChain(chain: ChainId, toIndex: number): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId || !(chain in CHAINS) || toIndex < 1 || toIndex >= CHAINS[chain].steps.length) return { ok: false };
  await prisma.chainProgress.upsert({
    where: { userId_chain: { userId, chain } },
    create: { userId, chain, level: toIndex },
    update: { level: toIndex },
  });
  return { ok: true };
}
