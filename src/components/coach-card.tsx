import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { type Coach } from "@/lib/data";

export function CoachCard({ coach }: { coach: Coach }) {
  return (
    <Link href={`/coach/${coach.slug}`} className="card grain flex flex-col p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center border border-white/40 mono text-xl">
            {coach.name
              .split(" ")
              .map((s) => s[0])
              .join("")}
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">{coach.name}</div>
            <div className="label mt-1">{coach.handle}</div>
          </div>
        </div>
        <ArrowUpRight size={16} className="opacity-60" />
      </div>
      <div className="mono mt-4 text-sm">{coach.title}</div>
      <p className="mt-3 text-sm text-[color:var(--color-mute)] line-clamp-3">{coach.bio}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {coach.specialties.map((s) => (
          <span key={s} className="label border border-[color:var(--color-line)] px-2 py-1">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[color:var(--color-line)] pt-4">
        <Stat label="NOTE" value={`${coach.rating}`} icon={<Star size={12} />} />
        <Stat label="ATHLÈTES" value={`${coach.athletes}`} />
        <Stat label="EXP." value={`${coach.yearsExp}a`} />
      </div>
    </Link>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono flex items-center gap-1 text-sm">
        {icon}
        {value}
      </div>
    </div>
  );
}
