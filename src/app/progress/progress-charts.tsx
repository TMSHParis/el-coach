"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type WeightPoint = { date: string; kg: number };
export type ScorePoint = { date: string; score: number };

const ACCENT = "#C9A84C";
const MUTED = "#555";
const GRID = "#1f1f1f";

function shortDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1f1f1f",
        borderRadius: 14,
        padding: "16px 16px 8px",
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: MUTED, textTransform: "uppercase", marginBottom: 8 }}>
        {title}
      </div>
      {empty ? (
        <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 12 }}>
          Pas encore assez de données
        </div>
      ) : (
        <div style={{ height: 180 }}>{children}</div>
      )}
    </div>
  );
}

function ProgressTooltip({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
      <div style={{ color: MUTED }}>{label ? shortDate(label) : ""}</div>
      <div style={{ color: "#fff", fontWeight: 700 }}>
        {payload[0].value}
        {unit}
      </div>
    </div>
  );
}

export function ProgressCharts({
  weightData,
  scoreData,
  stats,
}: {
  weightData: WeightPoint[];
  scoreData: ScorePoint[];
  stats: { checkinsTotal: number; sessionsCompleted: number; currentStreak: number; bestStreak: number };
}) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 60px" }}>
      <ChartCard title="Évolution du poids · 30 derniers jours" empty={weightData.length < 2}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weightData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} stroke={MUTED} tick={{ fontSize: 10 }} minTickGap={24} />
            <YAxis stroke={MUTED} tick={{ fontSize: 10 }} domain={["auto", "auto"]} width={40} />
            <Tooltip content={<ProgressTooltip unit=" kg" />} />
            <Line
              type="monotone"
              dataKey="kg"
              stroke={ACCENT}
              strokeWidth={2}
              dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              strokeLinecap="round"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Score ECM · 30 derniers jours" empty={scoreData.length < 2}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={scoreData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} stroke={MUTED} tick={{ fontSize: 10 }} minTickGap={24} />
            <YAxis stroke={MUTED} tick={{ fontSize: 10 }} domain={[0, 100]} width={30} />
            <Tooltip content={<ProgressTooltip unit="/100" />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={ACCENT}
              strokeWidth={2}
              dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              strokeLinecap="round"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <StatTile label="Check-ins complétés" value={stats.checkinsTotal} />
        <StatTile label="Séances terminées" value={stats.sessionsCompleted} />
        <StatTile label="Streak actuel" value={stats.currentStreak} suffix=" j" />
        <StatTile label="Meilleur streak" value={stats.bestStreak} suffix=" j" />
      </div>
    </div>
  );
}

function StatTile({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
        {value}
        {suffix}
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );
}
