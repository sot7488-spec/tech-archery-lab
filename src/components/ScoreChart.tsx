"use client";

import {
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
    <div className="h-72 rounded-[2rem] border border-cyan-400/20 bg-white/10 p-5 shadow-2xl backdrop-blur">
      <h3 className="mb-4 text-xl font-black text-white">
        Evolución de scores
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#22d3ee"
            strokeWidth={4}
            dot={{ r: 5 }}
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}