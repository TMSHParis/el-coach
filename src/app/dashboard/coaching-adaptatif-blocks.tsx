// ============================================================================
// Coaching Adaptatif — blocs UI du Dashboard (Section 8 du doc final v2)
// ============================================================================
// Ces composants affichent les nouvelles données du Coaching Adaptatif :
// Score ECM, Sommeil 7 nuits, Suivi poids, Stack 4 moments, Alertes.
// Les données sont MOCK pour l'instant — câblage Supabase + Claude Sonnet 4
// à l'Étape 2.5.

import { AlertTriangle, Bell, Info, Moon, Scale } from "lucide-react";
import {
  type Alert,
  type EcmScore,
  type SleepInsight,
  type StackMoment,
  type WeightInsight,
} from "@/lib/coaching-adaptatif-mock";

const STATE_BG: Record<EcmScore["state"], string> = {
  green: "bg-emerald-500/10 border-emerald-500/40",
  yellow: "bg-[color:var(--color-accent)]/10 border-[color:var(--color-accent)]/40",
  red: "bg-red-500/10 border-red-500/40",
};
const STATE_DOT: Record<EcmScore["state"], string> = {
  green: "bg-emerald-400",
  yellow: "bg-[color:var(--color-accent)]",
  red: "bg-red-400",
};
const STATE_LETTER_COLOR: Record<EcmScore["state"], string> = {
  green: "text-emerald-300",
  yellow: "text-[color:var(--color-accent)]",
  red: "text-red-300",
};
const STATE_LABEL: Record<EcmScore["state"], string> = {
  green: "VERT",
  yellow: "JAUNE",
  red: "ROUGE",
};

// ============================================================================
// Carte Score ECM — bloc principal en tête du dashboard
// ============================================================================

export function EcmScoreCard({ ecm }: { ecm: EcmScore }) {
  return (
    <div className={`mt-10 grid gap-6 border ${STATE_BG[ecm.state]} p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8`}>
      <div className="flex items-center gap-4">
        <div className={`h-3 w-3 rounded-full ${STATE_DOT[ecm.state]} animate-pulse`} />
        <div>
          <div className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-mute)]">
            [ SCORE ECM · {STATE_LABEL[ecm.state]} ]
          </div>
          <div className={`mono mt-1 text-6xl font-semibold leading-none ${STATE_LETTER_COLOR[ecm.state]}`}>
            {ecm.letter}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{ecm.headline}</h2>
        <p className="mt-2 text-sm text-[color:var(--color-mute)] md:text-base">{ecm.summary}</p>
      </div>
      <div className="text-right">
        <div className="mono text-[10px] tracking-[0.2em] text-[color:var(--color-mute)]">SCORE /100</div>
        <div className="mono mt-1 text-3xl font-semibold tabular-nums">{ecm.numeric}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Carte Sommeil — 7 nuits + sparkline + alertes
// ============================================================================

function formatHm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function SleepCard({ sleep }: { sleep: SleepInsight }) {
  const max = Math.max(...sleep.nights.map((n) => n.totalMinutes));
  const min = Math.min(...sleep.nights.map((n) => n.totalMinutes));
  const range = Math.max(60, max - min);

  return (
    <div className="card flex flex-col gap-5 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label text-[color:var(--color-data)]">[ SOMMEIL · 7 NUITS ]</div>
          <h3 className="mt-2 text-lg font-semibold">
            {formatHm(sleep.lastNight.totalMinutes)} <span className="text-[color:var(--color-mute)] font-normal">cette nuit</span>
          </h3>
        </div>
        <Moon size={20} className="shrink-0 text-[color:var(--color-data)]" />
      </div>

      <div className="grid grid-cols-3 gap-3 border-y border-[color:var(--color-line)] py-3">
        <Stat label="Profond" value={`${sleep.lastNight.deepMinutes}min`} alert={sleep.lastNight.deepMinutes < 40} />
        <Stat label="REM" value={`${sleep.lastNight.remMinutes}min`} alert={sleep.lastNight.remMinutes < 90} />
        <Stat label="Éveil" value={`${sleep.lastNight.awakeMinutes}min`} alert={sleep.lastNight.awakeMinutes > 120} />
      </div>

      <div>
        <div className="mono text-[10px] tracking-[0.2em] text-[color:var(--color-mute)]">
          TENDANCE · {sleep.trendMinutes >= 0 ? "+" : ""}{sleep.trendMinutes}min vs 7j précédents
        </div>
        <div className="mt-3 flex h-16 items-end gap-1">
          {sleep.nights.map((n) => {
            const h = Math.max(8, Math.round(((n.totalMinutes - min) / range) * 56 + 8));
            return (
              <div key={n.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full bg-[color:var(--color-data)] transition-all"
                  style={{ height: `${h}px`, opacity: n === sleep.lastNight ? 1 : 0.5 }}
                />
                <div className="mono text-[9px] tracking-[0.1em] text-[color:var(--color-mute)]">
                  {n.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sleep.alerts.length > 0 && (
        <ul className="space-y-1 border-t border-[color:var(--color-line)] pt-3 text-xs text-amber-300">
          {sleep.alerts.map((a) => (
            <li key={a} className="flex items-start gap-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <div className="mono text-[10px] tracking-[0.2em] text-[color:var(--color-mute)]">
        {label.toUpperCase()}
      </div>
      <div className={`mono mt-1 text-base font-semibold tabular-nums ${alert ? "text-amber-300" : ""}`}>
        {value}
      </div>
    </div>
  );
}

// ============================================================================
// Carte Suivi poids — historique + delta + sparkline
// ============================================================================

export function WeightCard({ weight }: { weight: WeightInsight }) {
  const max = Math.max(...weight.history.map((p) => p.kg));
  const min = Math.min(...weight.history.map((p) => p.kg));
  const range = Math.max(0.5, max - min);
  const sign = weight.deltaWeek > 0 ? "+" : "";

  return (
    <div className="card flex flex-col gap-5 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label text-[color:var(--color-data)]">[ SUIVI POIDS ]</div>
          <h3 className="mt-2 text-lg font-semibold">
            {weight.today.toFixed(1)} <span className="text-[color:var(--color-mute)] font-normal">kg ce matin</span>
          </h3>
          <div className="mono mt-1 text-xs text-[color:var(--color-mute)]">
            {sign}{weight.deltaWeek.toFixed(1)} kg sur 7 jours
          </div>
        </div>
        <Scale size={20} className="shrink-0 text-[color:var(--color-data)]" />
      </div>

      <div className="relative flex h-24 items-end">
        <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[color:var(--color-data)]"
            points={weight.history
              .map((p, i) => {
                const x = (i / (weight.history.length - 1)) * 100;
                const y = 40 - ((p.kg - min) / range) * 35 - 2;
                return `${x},${y}`;
              })
              .join(" ")}
          />
          {weight.history.map((p, i) => {
            const x = (i / (weight.history.length - 1)) * 100;
            const y = 40 - ((p.kg - min) / range) * 35 - 2;
            const isLast = i === weight.history.length - 1;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isLast ? 1.8 : 1}
                className={isLast ? "fill-white" : "fill-[color:var(--color-data)]"}
              />
            );
          })}
        </svg>
      </div>

      <div className="mono flex justify-between text-[9px] tracking-[0.1em] text-[color:var(--color-mute)]">
        {weight.history.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Carte Stack 4 moments — matin à jeun / midi / pré-séance / soir
// ============================================================================

export function StackCard({ stack }: { stack: StackMoment[] }) {
  return (
    <div className="card mt-6 p-5 md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="label text-[color:var(--color-accent)]">[ STACK COMPLÉMENTS · 4 MOMENTS ]</div>
          <h3 className="mt-2 text-lg font-semibold">Ton stack du jour</h3>
          <p className="mt-1 text-xs text-[color:var(--color-mute)]">
            Compléments organisés par moment de prise, activés / pausés selon ton état.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-px bg-[color:var(--color-line)] md:grid-cols-4">
        {stack.map((moment) => (
          <div
            key={moment.slot}
            className="flex flex-col gap-3 bg-[color:var(--color-ash)] p-4"
          >
            <div>
              <div className="text-xl leading-none">{moment.emoji}</div>
              <div className="mono mt-2 text-[10px] tracking-[0.2em] text-[color:var(--color-mute)]">
                {moment.label.toUpperCase()}
              </div>
            </div>
            <ul className="space-y-2">
              {moment.items.map((item) => (
                <li
                  key={item.name}
                  className={`text-xs ${item.active ? "" : "opacity-40 line-through"}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{item.name}</span>
                    {item.dose && (
                      <span className="mono text-[10px] tabular-nums text-[color:var(--color-mute)]">
                        {item.dose}
                      </span>
                    )}
                  </div>
                  {item.note && (
                    <div className="mt-0.5 text-[10px] text-[color:var(--color-mute)]">
                      {item.note}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Carte Alertes — blessures / sommeil / récup
// ============================================================================

const ALERT_STYLE: Record<Alert["level"], { border: string; color: string; icon: React.ReactNode }> = {
  info: {
    border: "border-l-[color:var(--color-data)]",
    color: "text-[color:var(--color-data-soft)]",
    icon: <Info size={14} />,
  },
  warning: {
    border: "border-l-amber-400",
    color: "text-amber-300",
    icon: <AlertTriangle size={14} />,
  },
  critical: {
    border: "border-l-red-500",
    color: "text-red-300",
    icon: <Bell size={14} />,
  },
};

export function AlertsCard({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="card mt-6 p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-amber-300" />
        <div className="label">[ ALERTES · {alerts.length} ]</div>
      </div>
      <ul className="mt-4 space-y-2">
        {alerts.map((a, i) => {
          const style = ALERT_STYLE[a.level];
          return (
            <li
              key={i}
              className={`flex items-start gap-3 border-l-2 bg-[color:var(--color-ash)] p-3 ${style.border}`}
            >
              <span className={`mt-0.5 shrink-0 ${style.color}`}>{style.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{a.message}</div>
                {a.hint && (
                  <div className="mt-0.5 text-xs text-[color:var(--color-mute)]">{a.hint}</div>
                )}
              </div>
              <span className="mono shrink-0 self-start text-[10px] tracking-[0.2em] text-[color:var(--color-mute)]">
                {a.category.toUpperCase()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
