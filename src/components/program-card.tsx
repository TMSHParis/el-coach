import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  type Program,
  getCoach,
  PROGRAM_ADDITIONAL_PRICE_CENTS,
} from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { formatNumber, type Lang } from "@/lib/i18n";

/** Prix localisé (centimes affichés seulement s'ils sont non nuls). */
function formatPrice(lang: Lang, cents: number, currency = "EUR") {
  const hasCents = cents % 100 !== 0;
  return formatNumber(lang, cents / 100, {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export async function ProgramCard({ program }: { program: Program }) {
  const { t, lang } = await getT();
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
        <Stat label={t("app.program.duration")} value={t("app.program.weeks", { n: program.weeks })} />
        <Stat label={t("app.program.freq")} value={t("app.program.perWeek", { n: program.sessionsPerWeek })} />
        <Stat label={t("app.program.level")} value={program.level.slice(0, 3)} />
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="label">{t("app.program.coach")}</div>
          <div className="mono text-sm">{coach?.name ?? "—"}</div>
        </div>
        <div className="text-right">
          <div className="mono text-2xl font-semibold">{formatPrice(lang, program.priceCents)}</div>
          <div className="label">{program.priceIntervalLabel}</div>
          <div className="mono mt-1 text-[10px] text-[color:var(--color-mute)]">
            {t("app.program.additional", { price: formatPrice(lang, PROGRAM_ADDITIONAL_PRICE_CENTS) })}
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
