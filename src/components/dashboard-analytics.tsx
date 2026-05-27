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
} from "recharts";

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
    "rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl";

  const radialData = [
    {
      name: "Accuracy",
      value: accuracy,
      fill: "#22d3ee",
    },
  ];

  return (
    <section className="rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 p-6 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          TAL Analytics Engine
        </p>

        <h2 className="mt-2 text-3xl font-black">
          Performance analytics
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Análisis dinámico de rendimiento y precisión.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className={`${cardClass} xl:col-span-2`}>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Performance
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Evolución de score
            </h3>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyScores}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis dataKey="name" stroke="#94a3b8" />

                <YAxis stroke="#94a3b8" />

                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid #155e75",
                    borderRadius: "16px",
                    color: "#fff",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  strokeWidth={4}
                  dot={{
                    r: 5,
                    fill: "#22d3ee",
                  }}
                  activeDot={{
                    r: 8,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Accuracy
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Precisión general
            </h3>
          </div>

          <div className="flex h-[280px] flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={20}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            <div className="-mt-28 text-center">
              <p className="text-5xl font-black text-cyan-300">
                {accuracy}%
              </p>

              <p className="mt-2 text-sm font-bold text-slate-400">
                Accuracy
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
            Arrow Distribution
          </p>

          <h3 className="mt-2 text-2xl font-black">
            Distribución de impactos
          </h3>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={arrowDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis dataKey="score" stroke="#94a3b8" />

              <YAxis stroke="#94a3b8" />

              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #155e75",
                  borderRadius: "16px",
                  color: "#fff",
                }}
              />

              <Bar
                dataKey="count"
                fill="#22d3ee"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}