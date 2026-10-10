"use client";

import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import styles from "./progress.module.css";

export type WeightPoint = { date: string; kg: number };
export type ScorePoint = { date: string; score: number };
export type MovementPoint = { date: string; charge: number };
export type Intensity = "legere" | "moderee" | "intense";
export type TimelineDay = { date: string; status: "done" | "rest" | "miss" | "future"; intensity?: Intensity };

const GOLD = "#C9A84C";
const MUTED = "#6b6b6b";
const GREEN = "#5FA97E";
const RED = "#C9605A";
const TIMELINE_COLORS: Record<TimelineDay["status"], string> = {
  done: GOLD,
  rest: "#5b7590",
  miss: "#8a4a45",
  future: "#232323",
};
const TIMELINE_LABELS: Record<TimelineDay["status"], string> = {
  done: "Check-in fait",
  rest: "Repos prévu",
  miss: "Manqué",
  future: "À venir",
};
/** Hauteur de barre pour un jour "done", proportionnelle à l'intensité ressentie (doc H.5). */
const INTENSITY_HEIGHTS: Record<Intensity, number> = { legere: 22, moderee: 32, intense: 40 };
const INTENSITY_COLORS: Record<Intensity, string> = { legere: "#8a7338", moderee: GOLD, intense: "#E8C96A" };
const INTENSITY_LABELS: Record<Intensity, string> = { legere: "légère", moderee: "modérée", intense: "intense" };

/** Légende en-tête du graphique d'assiduité — doc H.5. */
export function TimelineLegend() {
  return (
    <div className={styles.heatLegend}>
      <span>
        <i style={{ background: INTENSITY_COLORS.intense }} /> Intense
      </span>
      <span>
        <i style={{ background: INTENSITY_COLORS.moderee }} /> Modérée
      </span>
      <span>
        <i style={{ background: INTENSITY_COLORS.legere }} /> Légère
      </span>
      <span>
        <i style={{ background: "#5b7590" }} /> Repos
      </span>
      <span>
        <i style={{ background: "#8a4a45" }} /> Manqué
      </span>
    </div>
  );
}

function shortDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#000", border: "1px solid #232323", borderRadius: 7, padding: "6px 10px", fontSize: 11 }}>
      <div style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: ".4px" }}>{label ? shortDate(label) : ""}</div>
      <div style={{ color: "#fff", fontWeight: 600, marginTop: 1 }}>
        {payload[0].value}
        {unit}
      </div>
    </div>
  );
}

function TimelineTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TimelineDay }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const label = d.status === "done" ? `Séance ${INTENSITY_LABELS[d.intensity ?? "moderee"]}` : TIMELINE_LABELS[d.status];
  return (
    <div style={{ background: "#000", border: "1px solid #232323", borderRadius: 7, padding: "6px 10px", fontSize: 11 }}>
      <div style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: ".4px" }}>{shortDate(d.date)}</div>
      <div style={{ color: "#fff", fontWeight: 600, marginTop: 1 }}>{label}</div>
    </div>
  );
}

/** Carte graphique "Poids"/"Score ECM" — aire dégradée + delta en en-tête (doc F.2/F.6). */
export function LineChartCard({
  title,
  data,
  dataKey,
  unit,
  betterWhenDown,
}: {
  title: string;
  data: { date: string; value: number }[];
  dataKey: string;
  unit: string;
  /** true = en baisse = positif (poids), false = en hausse = positif (score ECM). */
  betterWhenDown: boolean;
}) {
  const empty = data.length < 2;
  const current = data[data.length - 1]?.value;
  const first = data[0]?.value;
  const delta = empty ? null : Math.round((current - first) * 10) / 10;
  const improving = delta !== null && (betterWhenDown ? delta < 0 : delta > 0);
  const gradId = `grad-${dataKey}`;

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>{title}</span>
        <span>
          {current !== undefined && (
            <span className={styles.cardValue}>
              {current}
              {unit}
            </span>
          )}
          {delta !== null && delta !== 0 && (
            <span className={`${styles.cardDelta} ${improving ? "down" : "up"}`} style={{ color: improving ? GREEN : RED }}>
              {delta > 0 ? "+" : ""}
              {delta}
              {unit}
            </span>
          )}
        </span>
      </div>
      {empty ? (
        <div className={styles.emptyChart}>Pas encore assez de données</div>
      ) : (
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.22} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine y={Math.max(...data.map((d) => d.value))} stroke="#232323" strokeWidth={1} />
            <ReferenceLine
              y={(Math.max(...data.map((d) => d.value)) + Math.min(...data.map((d) => d.value))) / 2}
              stroke="#232323"
              strokeWidth={1}
            />
            <ReferenceLine y={Math.min(...data.map((d) => d.value))} stroke="#232323" strokeWidth={1} />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip content={<ChartTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={GOLD}
              strokeWidth={1.8}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 3.5, fill: "#fff", stroke: GOLD, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/**
 * Timeline 30 jours — barres colorées par type de jour, hauteur proportionnelle
 * à l'intensité pour les jours "fait" (doc H.5, remplace la hauteur fixe F.5.b).
 * Curseur vertical + agrandissement de la barre au survol/tap (reprend F.6).
 */
export function TimelineChart({ data }: { data: TimelineDay[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const base = data.map((d) => ({
    ...d,
    baseH: d.status === "future" ? 14 : d.status === "done" ? INTENSITY_HEIGHTS[d.intensity ?? "moderee"] : 26,
  }));
  const heights = base.map((d, i) => ({ ...d, h: i === activeIndex ? Math.min(46, d.baseH + 6) : d.baseH }));

  const handleMove = (state: { activeTooltipIndex?: unknown }) => {
    const idx = Number(state?.activeTooltipIndex);
    if (Number.isFinite(idx)) setActiveIndex(idx);
  };
  const handleLeave = () => setActiveIndex(null);
  const activeDate = activeIndex !== null ? heights[activeIndex]?.date : undefined;

  return (
    <>
      <ResponsiveContainer width="100%" height={50}>
        <BarChart
          data={heights}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          barGap={2}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          onTouchMove={handleMove}
          onTouchEnd={handleLeave}
        >
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[0, 46]} />
          <Tooltip content={<TimelineTooltip />} cursor={false} />
          {activeDate && <ReferenceLine x={activeDate} stroke="#C9A84C" strokeWidth={1} strokeDasharray="2 2" />}
          <Bar dataKey="h" radius={[1, 1, 0, 0]} isAnimationActive={false}>
            {heights.map((d, i) => (
              <Cell
                key={i}
                fill={d.status === "done" ? INTENSITY_COLORS[d.intensity ?? "moderee"] : TIMELINE_COLORS[d.status]}
                opacity={d.status === "future" ? 0.5 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className={styles.timelineWeeks}>
        <span>S.1</span>
        <span>S.2</span>
        <span>S.3</span>
        <span>S.4</span>
      </div>
    </>
  );
}

/** Évolution de la charge d'un mouvement précis — lien "Historique du mouvement" sur le compte rendu. */
export function MovementChart({ movement, data }: { movement: string; data: MovementPoint[] }) {
  return (
    <LineChartCard
      title={`${movement} · évolution de la charge`}
      data={data.map((d) => ({ date: d.date, value: d.charge }))}
      dataKey="movement"
      unit=" kg"
      betterWhenDown={false}
    />
  );
}
