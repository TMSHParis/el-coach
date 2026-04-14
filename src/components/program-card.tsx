import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Program, getCoach } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export function ProgramCard({ program }: { program: Program }) {
  const coach = getCoach(program.coachSlug);
  return (
    <Link
      href={`/program/${program.slug}`}
      className="card grain flex flex-col justify-between p-6"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="label">{program.category}</span>
          <ArrowUpRight size={16} className="opacity-60" />
        </div>
        <h3 className="mt-6 text-xl font-semibold leading-tight tracking-tight">
          {program.title}
        </h3>
        <p className="mt-3 text-sm text-[color:var(--color-mute)] line-clamp-3">
          {program.description}
        </p>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-4">
        <Stat label="DURÉE" value={`${program.weeks}sem`} />
        <Stat label="FRÉQ." value={`${program.sessionsPerWeek}/sem`} />
        <Stat label="NIVEAU" value={program.level.slice(0, 3)} />
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="label">Coach</div>
          <div className="mono text-sm">{coach?.name ?? "—"}</div>
        </div>
        <div className="text-right">
          <div className="mono text-2xl font-semibold">{formatPrice(program.priceCents)}</div>
          <div className="label">{program.priceIntervalLabel}</div>
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
