import "server-only";
import { prisma } from "./prisma";
import { CHAINS, type ChainId } from "./chains";

export async function getChainLevels(userId: string): Promise<Partial<Record<ChainId, number>>> {
  const rows = await prisma.chainProgress.findMany({ where: { userId } });
  const out: Partial<Record<ChainId, number>> = {};
  for (const r of rows) if (r.chain in CHAINS) out[r.chain as ChainId] = r.level;
  return out;
}
