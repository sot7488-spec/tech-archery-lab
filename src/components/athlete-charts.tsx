"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Crosshair,
  Gauge,
  type LucideIcon,
} from "lucide-react";
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

type Accent = "cyan" | "sky" | "emerald" | "yellow";

const accentMap = {
  cyan: {
    glow: "from-cyan-400/18 via-slate-950 to-slate-950",
    border: "border-cyan-300/20",
    icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
    badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  },
  sky: {
    glow: "from-sky-400/18 via-slate-950 to-slate-950",
    border: "border-sky-300/20",
    icon: "border-sky-300/25 bg-sky-300/10 text-sky-200",
    badge: "border-sky-300/20 bg-sky-300/10 text-sky-200",
  },
  emerald: {
    glow: "from-emerald-400/16 via-slate-950 to-slate-950",
    border: "border-emerald-300/20",
    icon: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  },
  yellow: {
    glow: "from-yellow-300/14 via-slate-950 to-slate-950",
    border: "border-yellow-300/20",
    icon: "border-yellow-300/25 bg-yellow-300/10 text-yellow-100",
    badge: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
  },
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
  icon: Icon,
  accent,
  children,
  delayMs = 0,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: Accent;
  children: (active: boolean) => React.ReactNode;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const styles = accentMap[accent];

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-[2rem] border ${styles.border} bg-gradient-to-br ${styles.glow} p-5 shadow-[0_0_58px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_0_62px_rgba(34,211,238,0.12)] ${
        active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full border border-white/10 opacity-70 transition duration-700 group-hover:scale-110" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/[0.035] to-transparent" />

      <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles.icon} shadow-[0_0_26px_rgba(34,211,238,0.10)]`}
          >
            <Icon size={20} />
          </span>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Analytics
            </p>
            <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
            <p className="mt-1 text-sm font-bold text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div
          className={`rounded-2xl border px-3 py-2 text-xs font-black ${styles.badge}`}
        >
          LIVE
        </div>
      </div>

      <div className="relative z-10 h-72">
        {active ? (
          children(active)
        ) : (
          <div className="h-full rounded-[1.4rem] border border-white/10 bg-white/[0.03]" />
        )}
      </div>
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] text-sm font-bold text-slate-500">
      Sin datos suficientes
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
        title="Evolucion del promedio"
        subtitle="Promedio por flecha en cada entrenamiento."
        icon={Gauge}
        accent="cyan"
      >
        {(active) =>
          trainingChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingChartData}>
                <defs>
                  <linearGradient id="averageLine" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="4 4" opacity={0.55} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line name="Promedio" type="monotone" dataKey="average" stroke="url(#averageLine)" strokeWidth={4} dot={{ r: 4, fill: "#22d3ee", stroke: "#020617", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#67e8f9" }} isAnimationActive={active} animationDuration={1400} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState />
          )
        }
      </ChartCard>

      <ChartCard
        title="Score por entrenamiento"
        subtitle="Tendencia de puntuacion total por sesion."
        icon={Activity}
        accent="sky"
        delayMs={90}
      >
        {(active) =>
          trainingChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingChartData}>
                <defs>
                  <linearGradient id="scoreLine" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="4 4" opacity={0.55} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line name="Score" type="monotone" dataKey="score" stroke="url(#scoreLine)" strokeWidth={4} dot={{ r: 4, fill: "#38bdf8", stroke: "#020617", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#7dd3fc" }} isAnimationActive={active} animationDuration={1400} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState />
          )
        }
      </ChartCard>

      <ChartCard
        title="X por entrenamiento"
        subtitle="Cantidad de X registradas por sesion."
        icon={Crosshair}
        accent="yellow"
        delayMs={160}
      >
        {(active) =>
          xChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={xChartData}>
                <defs>
                  <linearGradient id="xBars" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="4 4" opacity={0.55} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar name="X" dataKey="xCount" fill="url(#xBars)" radius={[12, 12, 0, 0]} isAnimationActive={active} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState />
          )
        }
      </ChartCard>

      <ChartCard
        title="Rendimiento por distancia"
        subtitle="Promedio de puntuacion agrupado por distancia."
        icon={BarChart3}
        accent="emerald"
        delayMs={230}
      >
        {(active) =>
          distanceChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceChartData}>
                <defs>
                  <linearGradient id="distanceBars" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="4 4" opacity={0.55} />
                <XAxis dataKey="distance" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar name="Promedio" dataKey="average" fill="url(#distanceBars)" radius={[12, 12, 0, 0]} isAnimationActive={active} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState />
          )
        }
      </ChartCard>
    </section>
  );
}
