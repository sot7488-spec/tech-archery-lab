"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  Area,
  AreaChart,
  Cell,
} from "recharts";
import { Activity, Crosshair, Radar } from "lucide-react";

type Props = {
  monthlyScores: {
    name: string;
    score: number;
  }[];

  arrowDistribution: {
    score: string;
    count: number;
  }[];

  accuracy: number;
};

export function DashboardAnalytics({
  monthlyScores,
  arrowDistribution,
  accuracy,
}: Props) {
  const cardClass =
    "tal-chart-card";

  const radialData = [
    {
      name: "Accuracy",
      value: accuracy,
      fill: "#22d3ee",
    },
  ];

  const barColors: Record<string, string> = {
    "10": "#facc15",
    "9": "#facc15",
    "8": "#ef4444",
    "7": "#3b82f6",
    "6": "#111827",
    "5": "#ffffff",
    "4": "#9ca3af",
    "3": "#9ca3af",
    "2": "#9ca3af",
    "1": "#9ca3af",
    M: "#dc2626",
  };

  return (
    <section className="relative overflow-hidden rounded-[2.8rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/10 p-6 shadow-[0_0_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl">

      {/* Glow background */}
      <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mb-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          TAL Analytics Engine
        </p>

        <h2 className="mt-3 text-4xl font-black tracking-tight tal-text-glow">
          Performance Analytics
        </h2>

        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Visualización avanzada de rendimiento, precisión y comportamiento competitivo.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* LINE / AREA CHART */}
        <div className={`${cardClass} xl:col-span-2`}>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_45%)]" />

          <div className="relative z-10 mb-5">
            <span className="tal-metric-icon">
              <Activity size={20} />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Score Evolution
            </p>

            <h3 className="mt-2 text-3xl font-black">
              Evolución de score
            </h3>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyScores}>

                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  opacity={0.3}
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  cursor={{
                    stroke: "#22d3ee",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    background: "rgba(2,6,23,0.95)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    borderRadius: "20px",
                    backdropFilter: "blur(12px)",
                    color: "#fff",
                    boxShadow: "0 0 30px rgba(34,211,238,0.15)",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="none"
                  fill="url(#scoreGradient)"
                />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  strokeWidth={4}
                  dot={{
                    r: 0,
                  }}
                  activeDot={{
                    r: 8,
                    fill: "#22d3ee",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RADIAL */}
        <div className={cardClass}>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_60%)]" />

          <div className="relative z-10 mb-5">
            <span className="tal-metric-icon">
              <Radar size={20} />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Accuracy
            </p>

            <h3 className="mt-2 text-3xl font-black">
              Precisión general
            </h3>
          </div>

          <div className="relative flex h-[340px] items-center justify-center">

            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{
                    fill: "#0f172a",
                  }}
                  dataKey="value"
                  cornerRadius={30}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            <div className="absolute text-center">
              <p className="text-6xl font-black text-cyan-300">
                {accuracy}%
              </p>

              <p className="mt-2 text-sm font-bold uppercase tracking-[0.25em] text-slate-500">
                Precision
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DISTRIBUTION */}
      <div className={cardClass}>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_50%)]" />

        <div className="relative z-10 mb-5">
          <span className="tal-metric-icon">
            <Crosshair size={20} />
          </span>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Arrow Distribution
          </p>

          <h3 className="mt-2 text-3xl font-black">
            Distribución de impactos
          </h3>
        </div>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={arrowDistribution}>

              <CartesianGrid
                stroke="#1e293b"
                strokeDasharray="3 3"
                opacity={0.3}
              />

              <XAxis
                dataKey="score"
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(255,255,255,0.03)",
                }}
                contentStyle={{
                  background: "rgba(2,6,23,0.95)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderRadius: "20px",
                  backdropFilter: "blur(12px)",
                  color: "#fff",
                  boxShadow: "0 0 30px rgba(34,211,238,0.15)",
                }}
              />

              <Bar
                dataKey="count"
                radius={[14, 14, 4, 4]}
              >
                {arrowDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[entry.score] || "#22d3ee"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
