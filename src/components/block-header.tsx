"use client";

import { useT, useLang } from "@/lib/i18n/provider";
import { tc } from "@/lib/i18n/content";
import {
  blockTag,
  displayBlockName,
  type Block,
} from "@/lib/programming";

type Props = {
  block: Block;
  /** Index 0-based du bloc dans la séance. */
  index: number;
  /** Compact = sans le numéro "Bloc N" en exergue (utile en plein écran). */
  compact?: boolean;
};

export function BlockHeader({ block, index, compact = false }: Props) {
  const t = useT();
  const { lang } = useLang();
  const name = displayBlockName(block);
  const tag = blockTag(block);

  return (
    <div>
      {!compact && (
        <div className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-mute)]">
          {t("app.block.number", { n: index + 1 }).toUpperCase()}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-xl font-semibold leading-tight md:text-2xl">{tc(lang, name)}</h3>
        {block.optional && (
          <span className="mono inline-flex items-center border border-[color:var(--color-line)] px-2 py-0.5 text-[10px] tracking-[0.25em] text-[color:var(--color-mute)]">
            {t("app.block.optional")}
          </span>
        )}
      </div>
      {tag && (
        <div className="mono mt-1 text-sm text-[color:var(--color-accent)]">
          [{tag}]
        </div>
      )}
    </div>
  );
}
