"use client";

import { useEffect, useRef, useState } from "react";
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
import { AnimatedNumber } from "@/components/AnimatedNumber";

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

type Accent = "cyan" | "emerald" | "yellow";

const accentMap = {
  cyan: {
    shell:
      "border-cyan-300/20 bg-gradient-to-br from-cyan-400/18 via-slate-950 to-slate-950",
    icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
    badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  },
  emerald: {
    shell:
      "border-emerald-300/20 bg-gradient-to-br from-emerald-400/16 via-slate-950 to-slate-950",
    icon: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  },
  yellow: {
    shell:
      "border-yellow-300/20 bg-gradient-to-br from-yellow-300/14 via-slate-950 to-slate-950",
    icon: "border-yellow-300/25 bg-yellow-300/10 text-yellow-100",
    badge: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
  },
};

function ChartShell({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent: Accent;
}) {
  const styles = accentMap[accent];

  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border ${styles.shell} p-5 shadow-[0_0_58px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_0_62px_rgba(34,211,238,0.12)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full border border-white/10 opacity-70 transition duration-700 group-hover:scale-110" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/[0.035] to-transparent" />
      {children}
    </div>
  );
}

function ChartTitle({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  accent,
}: {
  icon: React.ComponentType<{ size?: number }>;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: Accent;
}) {
  const styles = accentMap[accent];

  return (
    <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles.icon} shadow-[0_0_26px_rgba(34,211,238,0.10)]`}
        >
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
          <p className="mt-1 text-sm font-bold text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className={`rounded-2xl border px-3 py-2 text-xs font-black ${styles.badge}`}>
        LIVE
      </div>
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div className="h-full rounded-[1.4rem] border border-white/10 bg-white/[0.03]" />
  );
}

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

export function DashboardAnalytics({
  monthlyScores,
  arrowDistribution,
  accuracy,
}: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  const radialData = [
    {
      name: "Accuracy",
      value: accuracy,
      fill: "#34d399",
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

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden rounded-[2.8rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/10 p-6 shadow-[0_0_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition duration-700 ease-out ${
        active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative z-10 mb-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          TAL Analytics Engine
        </p>
        <h2 className="mt-3 text-4xl font-black tracking-tight tal-text-glow">
          Performance Analytics
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-bold text-slate-400">
          Visualizacion avanzada de rendimiento, precision y comportamiento competitivo.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ChartShell className="xl:col-span-2" accent="cyan">
          <ChartTitle
            icon={Activity}
            eyebrow="Score Evolution"
            title="Evolucion de score"
            subtitle="Tendencia de puntuacion por sesion."
            accent="cyan"
          />
          <div className="relative z-10 h-[340px]">
            {active && monthlyScores.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyScores}>
                  <defs>
                    <linearGradient id="dashboardScoreArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashboardScoreLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1f2a44" strokeDasharray="4 4" opacity={0.55} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="none" fill="url(#dashboardScoreArea)" isAnimationActive={active} animationDuration={1400} />
                  <Line type="monotone" dataKey="score" stroke="url(#dashboardScoreLine)" strokeWidth={4} dot={{ r: 4, fill: "#22d3ee", stroke: "#020617", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#67e8f9" }} isAnimationActive={active} animationDuration={1400} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder />
            )}
          </div>
        </ChartShell>

        <ChartShell accent="emerald">
          <ChartTitle
            icon={Radar}
            eyebrow="Accuracy"
            title="Precision general"
            subtitle="Porcentaje de rendimiento global."
            accent="emerald"
          />
          <div className="relative flex h-[340px] items-center justify-center">
            {active ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="72%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{ fill: "#0f172a" }}
                    dataKey="value"
                    cornerRadius={30}
                    isAnimationActive={active}
                    animationDuration={1400}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder />
            )}
            <div className="absolute text-center">
              <p className="text-6xl font-black text-emerald-300">
                <AnimatedNumber value={accuracy} suffix="%" decimals={1} />
              </p>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.25em] text-slate-500">
                Precision
              </p>
            </div>
          </div>
        </ChartShell>
      </div>

      <ChartShell accent="yellow">
        <ChartTitle
          icon={Crosshair}
          eyebrow="Arrow Distribution"
          title="Distribucion de impactos"
          subtitle="Frecuencia de flechas por valor registrado."
          accent="yellow"
        />
        <div className="relative z-10 h-[360px]">
          {active ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arrowDistribution}>
                <CartesianGrid stroke="#1f2a44" strokeDasharray="4 4" opacity={0.55} />
                <XAxis dataKey="score" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[14, 14, 4, 4]} isAnimationActive={active} animationDuration={1400}>
                  {arrowDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[entry.score] || "#22d3ee"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartPlaceholder />
          )}
        </div>
      </ChartShell>
    </section>
  );
}
