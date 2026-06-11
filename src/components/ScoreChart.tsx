"use client";

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import {
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ScoreChart({
  data,
}: {
  data: { date: string; score: number }[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

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
      className={`group relative h-80 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/18 via-slate-950 to-slate-950 p-5 shadow-[0_0_58px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_0_62px_rgba(34,211,238,0.12)] ${
        active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full border border-white/10 opacity-70 transition duration-700 group-hover:scale-110" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/[0.035] to-transparent" />

      <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.10)]">
            <Activity size={20} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Dashboard
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Evolucion de scores
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Ultimos entrenamientos registrados.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-200">
          LIVE
        </div>
      </div>

      <div className="relative z-10 h-[220px]">
        {active && data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="scoreLineDashboard" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2a44" strokeDasharray="4 4" opacity={0.55} />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#334155" }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(2, 6, 23, 0.95)",
                  border: "1px solid rgba(34, 211, 238, 0.24)",
                  borderRadius: "18px",
                  color: "#f8fafc",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                }}
                labelStyle={{ color: "#67e8f9", fontWeight: 900 }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="none"
                fill="url(#scoreGlow)"
                isAnimationActive={active}
                animationDuration={1400}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#scoreLineDashboard)"
                strokeWidth={4}
                dot={{ r: 4, strokeWidth: 2, fill: "#020617", stroke: "#67e8f9" }}
                activeDot={{ r: 7, strokeWidth: 2, fill: "#22d3ee", stroke: "#ecfeff" }}
                isAnimationActive={active}
                animationDuration={1400}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-[1.4rem] border border-white/10 bg-white/[0.03]" />
        )}
      </div>
    </div>
  );
}
