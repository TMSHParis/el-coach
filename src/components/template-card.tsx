import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProgramIcon } from "@/components/program-icon";
import { type ProgramTemplate } from "@/lib/programming";

export function TemplateCard({ template }: { template: ProgramTemplate }) {
  return (
    <Link
      href={`/training/${template.slug}`}
      className="card grain flex flex-col justify-between p-6 transition-colors hover:bg-black"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="text-white">
            <ProgramIcon template={template} size={32} />
          </div>
          <ArrowUpRight size={16} className="opacity-60" />
        </div>
        <h3 className="mt-6 text-xl font-semibold leading-tight tracking-tight">
          {template.name}
        </h3>
        <div className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-mute)]">
          · by El Coach Method
        </div>
        {template.tagline && (
          <div className="mt-1 text-xs italic text-[color:var(--color-mute)]">
            {template.tagline}
          </div>
        )}
        <p className="mt-4 line-clamp-3 text-sm text-[color:var(--color-mute)]">
          {template.summary}
        </p>
      </div>
    </Link>
  );
}
