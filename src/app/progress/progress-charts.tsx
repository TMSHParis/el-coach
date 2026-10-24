"use client";

import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useLang, useT } from "@/lib/i18n/provider";
import { formatDate, formatNumber, type DictKey, type Lang } from "@/lib/i18n";
import styles from "./progress.module.css";

export type WeightPoint = { date: string; kg: number };
export type ScorePoint = { date: string; score: number };
export type MovementPoint = { date: string; charge: number };
export type Intensity = "legere" | "moderee" | "intense";
export type TimelineDay = { date: string; status: "done" | "rest" | "miss" | "future"; intensity?: Intensity };

const GOLD = "var(--c-c9a84c)";
const MUTED = "var(--c-6b6b6b)";
const GREEN = "var(--c-5fa97e)";
const RED = "var(--c-c9605a)";
const TIMELINE_COLORS: Record<TimelineDay["status"], string> = {
  done: GOLD,
  rest: "var(--c-5b7590)",
  miss: "var(--c-8a4a45)",
  future: "var(--c-232323)",
};
const TIMELINE_LABELS: Record<TimelineDay["status"], DictKey> = {
  done: "app.charts.checkinDone",
  rest: "app.charts.restPlanned",
  miss: "app.charts.missed",
  future: "app.charts.upcoming",
};
/** Hauteur de barre pour un jour "done", proportionnelle à l'intensité ressentie (doc H.5). */
const INTENSITY_HEIGHTS: Record<Intensity, number> = { legere: 22, moderee: 32, intense: 40 };
const INTENSITY_COLORS: Record<Intensity, string> = { legere: "var(--c-8a7338)", moderee: GOLD, intense: "var(--c-e8c96a)" };
const INTENSITY_LABELS: Record<Intensity, DictKey> = {
  legere: "app.charts.sessionLight",
  moderee: "app.charts.sessionModerate",
  intense: "app.charts.sessionIntense",
};

/** Légende en-tête du graphique d'assiduité — doc H.5. */
export function TimelineLegend() {
  const t = useT();
  return (
    <div className={styles.heatLegend}>
      <span>
        <i style={{ background: INTENSITY_COLORS.intense }} /> {t("app.charts.legendIntense")}
      </span>
      <span>
        <i style={{ background: INTENSITY_COLORS.moderee }} /> {t("app.charts.legendModerate")}
      </span>
      <span>
        <i style={{ background: INTENSITY_COLORS.legere }} /> {t("app.charts.legendLight")}
      </span>
      <span>
        <i style={{ background: "var(--c-5b7590)" }} /> {t("app.charts.legendRest")}
      </span>
      <span>
        <i style={{ background: "var(--c-8a4a45)" }} /> {t("app.charts.legendMissed")}
      </span>
    </div>
  );
}

function shortDate(lang: Lang, d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return formatDate(lang, new Date(y, m - 1, day), { day: "2-digit", month: "2-digit" });
}

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; unit: string }) {
  const { lang } = useLang();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--c-0a0a0a)", border: "1px solid var(--c-232323)", borderRadius: 7, padding: "6px 10px", fontSize: 11 }}>
      <div style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: ".4px" }}>{label ? shortDate(lang, label) : ""}</div>
      <div style={{ color: "var(--c-ffffff)", fontWeight: 600, marginTop: 1 }}>
        {formatNumber(lang, payload[0].value)}
        {unit}
      </div>
    </div>
  );
}

function TimelineTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TimelineDay }> }) {
  const t = useT();
  const { lang } = useLang();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const label = d.status === "done" ? t(INTENSITY_LABELS[d.intensity ?? "moderee"]) : t(TIMELINE_LABELS[d.status]);
  return (
    <div style={{ background: "var(--c-0a0a0a)", border: "1px solid var(--c-232323)", borderRadius: 7, padding: "6px 10px", fontSize: 11 }}>
      <div style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: ".4px" }}>{shortDate(lang, d.date)}</div>
      <div style={{ color: "var(--c-ffffff)", fontWeight: 600, marginTop: 1 }}>{label}</div>
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
  const t = useT();
  const { lang } = useLang();
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
              {formatNumber(lang, current)}
              {unit}
            </span>
          )}
          {delta !== null && delta !== 0 && (
            <span className={`${styles.cardDelta} ${improving ? "down" : "up"}`} style={{ color: improving ? GREEN : RED }}>
              {delta > 0 ? "+" : ""}
              {formatNumber(lang, delta)}
              {unit}
            </span>
          )}
        </span>
      </div>
      {empty ? (
        <div className={styles.emptyChart}>{t("app.charts.notEnoughData")}</div>
      ) : (
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.22} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine y={Math.max(...data.map((d) => d.value))} stroke="var(--c-232323)" strokeWidth={1} />
            <ReferenceLine
              y={(Math.max(...data.map((d) => d.value)) + Math.min(...data.map((d) => d.value))) / 2}
              stroke="var(--c-232323)"
              strokeWidth={1}
            />
            <ReferenceLine y={Math.min(...data.map((d) => d.value))} stroke="var(--c-232323)" strokeWidth={1} />
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
              activeDot={{ r: 3.5, fill: "var(--c-ffffff)", stroke: GOLD, strokeWidth: 2 }}
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
  const t = useT();
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
          {activeDate && <ReferenceLine x={activeDate} stroke="var(--c-c9a84c)" strokeWidth={1} strokeDasharray="2 2" />}
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
        <span>{t("app.charts.week", { n: 1 })}</span>
        <span>{t("app.charts.week", { n: 2 })}</span>
        <span>{t("app.charts.week", { n: 3 })}</span>
        <span>{t("app.charts.week", { n: 4 })}</span>
      </div>
    </>
  );
}

/** Évolution de la charge d'un mouvement précis — lien "Historique du mouvement" sur le compte rendu. */
export function MovementChart({ movement, data }: { movement: string; data: MovementPoint[] }) {
  const t = useT();
  return (
    <LineChartCard
      title={t("app.charts.loadEvolution", { movement })}
      data={data.map((d) => ({ date: d.date, value: d.charge }))}
      dataKey="movement"
      unit=" kg"
      betterWhenDown={false}
    />
  );
}
