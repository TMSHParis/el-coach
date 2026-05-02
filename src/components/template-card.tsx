import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type ProgramTemplate } from "@/lib/programming";
import {
  PROGRAM_BASE_PRICE_CENTS,
  PROGRAM_ADDITIONAL_PRICE_CENTS,
} from "@/lib/data";
import { formatPrice } from "@/lib/utils";

const DISCIPLINE_LABEL: Record<ProgramTemplate["discipline"], string> = {
  crossfit: "CrossFit pure",
  hybrid: "Hybrid Engine",
  hyrox: "Hyrox pure",
  home: "À la maison",
  hypertrophy: "Hypertrophy · Volume Block",
};

export function TemplateCard({ template }: { template: ProgramTemplate }) {
  const sessionsPerWeek =
    template.weeks[0]?.days.filter((d) => d.blocks.length > 0).length ?? 0;
  return (
    <Link
      href={`/training/${template.slug}`}
      className="card grain flex flex-col justify-between p-6 transition-colors hover:bg-black"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="label">{DISCIPLINE_LABEL[template.discipline]}</span>
          <ArrowUpRight size={16} className="opacity-60" />
        </div>
        <h3 className="mt-6 text-xl font-semibold leading-tight tracking-tight">
          {template.name}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm text-[color:var(--color-mute)]">
          {template.summary}
        </p>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-4">
        <Stat label="JOURS" value={`${sessionsPerWeek}/sem`} />
        <Stat label="NIVEAU" value={template.level.slice(0, 3).toUpperCase()} />
        <Stat label="SEMAINES" value={`${template.weeks.length}`} />
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="label">Programmation</div>
          <div className="mono text-sm">EL COACH</div>
        </div>
        <div className="text-right">
          <div className="mono text-2xl font-semibold">
            {formatPrice(PROGRAM_BASE_PRICE_CENTS)}
          </div>
          <div className="label">/mois</div>
          <div className="mono mt-1 text-[10px] text-[color:var(--color-mute)]">
            +{formatPrice(PROGRAM_ADDITIONAL_PRICE_CENTS)} / programme additionnel
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono text-sm">{value}</div>
    </div>
  );
}
