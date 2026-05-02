import { Trophy } from "lucide-react";
import {
  blockSchemeLine,
  scoreType,
  sectionLabel,
  type Block,
} from "@/lib/programming";

type Props = {
  block: Block;
  letter: string;
  showSection?: boolean;
};

export function BlockHeader({ block, letter, showSection = true }: Props) {
  const section = showSection ? sectionLabel(block) : null;
  const scheme = blockSchemeLine(block);
  const score = scoreType(block);

  return (
    <div>
      {section && <div className="label text-xs">{section}</div>}
      <div className="mt-2 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-line)] text-base font-semibold">
          {letter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-xl font-semibold leading-tight md:text-2xl">{block.name}</h3>
            {score && (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-400">
                <Trophy size={14} /> {score}
              </span>
            )}
          </div>
          {scheme && (
            <div className="mono mt-1 text-sm text-[color:var(--color-mute)]">{scheme}</div>
          )}
        </div>
      </div>
    </div>
  );
}
