"use client";

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
  return (
    <div className="tal-chart-card h-72">
      <div className="mb-4 flex items-center gap-3">
        <span className="tal-metric-icon mb-0">
          <Activity size={20} />
        </span>
        <h3 className="text-xl font-black text-white tal-text-glow">
        Evolución de scores
        </h3>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
          <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(2, 6, 23, 0.92)",
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
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#22d3ee"
            strokeWidth={4}
            dot={{ r: 5, strokeWidth: 2, fill: "#020617", stroke: "#67e8f9" }}
            activeDot={{ r: 7, strokeWidth: 2, fill: "#22d3ee", stroke: "#ecfeff" }}
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
