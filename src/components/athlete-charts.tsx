"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = {
  date?: string;
  score?: number;
  average?: number;
  xCount?: number;
  distance?: string | number;
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur">
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-cyan-300">
        {label}
      </p>

      {payload.map((item: any) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-slate-300">{item.name}:</span>
          <span className="font-black text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-5 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Analytics
          </p>

          <h3 className="mt-2 text-xl font-black text-white">{title}</h3>

          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-300">
          LIVE
        </div>
      </div>

      <div className="h-72">{children}</div>
    </div>
  );
}

export function AthleteCharts({
  trainingChartData,
  xChartData,
  distanceChartData,
}: {
  trainingChartData: ChartPoint[];
  xChartData: ChartPoint[];
  distanceChartData: ChartPoint[];
}) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ChartCard
        title="Evolución del promedio"
        subtitle="Promedio por flecha en cada entrenamiento."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trainingChartData}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              domain={[0, 10]}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              name="Promedio"
              type="monotone"
              dataKey="average"
              stroke="#22d3ee"
              strokeWidth={4}
              dot={{ r: 4, fill: "#22d3ee", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: "#67e8f9" }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Score por entrenamiento"
        subtitle="Tendencia de puntuación total por sesión."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trainingChartData}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              name="Score"
              type="monotone"
              dataKey="score"
              stroke="#38bdf8"
              strokeWidth={4}
              dot={{ r: 4, fill: "#38bdf8", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: "#7dd3fc" }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="X por entrenamiento"
        subtitle="Cantidad de X registradas por sesión."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={xChartData}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              allowDecimals={false}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              name="X"
              dataKey="xCount"
              fill="#22d3ee"
              radius={[12, 12, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Rendimiento por distancia"
        subtitle="Promedio de puntuación agrupado por distancia."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distanceChartData}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
            <XAxis
              dataKey="distance"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              domain={[0, 10]}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              name="Promedio"
              dataKey="average"
              fill="#06b6d4"
              radius={[12, 12, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}