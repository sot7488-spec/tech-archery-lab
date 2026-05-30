"use client";

import { BarChart3, Crosshair, Gauge, LineChart as LineChartIcon, Medal, Target, TrendingDown, Trophy } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

type Props = {
  series: any[];
  arrows: any[];
  totalScore: number;
};

export function TrainingAnalytics({
  series,
  arrows,
  totalScore,
}: Props) {
  const totalArrows = arrows.length;

  const averageArrow =
    totalArrows > 0
      ? (totalScore / totalArrows).toFixed(2)
      : "0.0";

  const maxPossibleScore = totalArrows * 10;

  const accuracy =
    maxPossibleScore > 0
      ? ((totalScore / maxPossibleScore) * 100).toFixed(1)
      : "0";

  const xCount = arrows.filter((a) => a.is_x).length;

  const missCount = arrows.filter(
    (a) => Number(a.score) === 0
  ).length;

  const bestSeries =
    series.length > 0
      ? Math.max(...series.map((s) => s.total_score || 0))
      : 0;

  const worstSeries =
    series.length > 0
      ? Math.min(...series.map((s) => s.total_score || 0))
      : 0;

  const seriesChart = series.map((serie, index) => ({
    name: `S${index + 1}`,
    score: serie.total_score,
  }));

  const arrowDistribution = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(
    (score) => ({
      score: score === 0 ? "M" : score,
      count: arrows.filter(
        (a) => Number(a.score) === score
      ).length,
    })
  );

  const cardClass = "tal-metric-card";
  const chartCardClass = "tal-chart-card";

  return (
    <section className="tal-hero-panel mb-8 p-6">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          TAL Performance Analytics
        </p>

        <h2 className="mt-2 text-3xl font-black tal-text-glow">
          Analíticas dinámicas
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Rendimiento estadístico y análisis de agrupación.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className={cardClass}>
          <span className="tal-metric-icon">
            <Gauge size={20} />
          </span>
          <p className="tal-metric-label">
            Precisión
          </p>

          <h3 className="tal-metric-value text-cyan-300">
            {accuracy}%
          </h3>
        </div>

        <div className={cardClass}>
          <span className="tal-metric-icon">
            <BarChart3 size={20} />
          </span>
          <p className="tal-metric-label">
            Promedio
          </p>

          <h3 className="tal-metric-value text-cyan-300">
            {averageArrow}
          </h3>
        </div>

        <div className={cardClass}>
          <span className="tal-metric-icon">
            <Trophy size={20} />
          </span>
          <p className="tal-metric-label">
            Mejor serie
          </p>

          <h3 className="tal-metric-value text-cyan-300">
            {bestSeries}
          </h3>
        </div>

        <div className={cardClass}>
          <span className="tal-metric-icon">
            <TrendingDown size={20} />
          </span>
          <p className="tal-metric-label">
            Peor serie
          </p>

          <h3 className="tal-metric-value text-cyan-300">
            {worstSeries}
          </h3>
        </div>

        <div className={cardClass}>
          <span className="tal-metric-icon">
            <Medal size={20} />
          </span>
          <p className="tal-metric-label">
            X Count
          </p>

          <h3 className="tal-metric-value text-yellow-300">
            {xCount}
          </h3>
        </div>

        <div className={cardClass}>
          <span className="tal-metric-icon">
            <Target size={20} />
          </span>
          <p className="tal-metric-label">
            Miss
          </p>

          <h3 className="tal-metric-value text-red-300">
            {missCount}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className={chartCardClass}>
          <div className="mb-5">
            <span className="tal-metric-icon">
              <LineChartIcon size={20} />
            </span>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Score Progression
            </p>

            <h3 className="mt-2 text-2xl font-black tal-text-glow">
              Evolución de score
            </h3>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis dataKey="name" stroke="#94a3b8" />

                <YAxis stroke="#94a3b8" />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  strokeWidth={4}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardClass}>
          <div className="mb-5">
            <span className="tal-metric-icon">
              <Crosshair size={20} />
            </span>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Arrow Distribution
            </p>

            <h3 className="mt-2 text-2xl font-black tal-text-glow">
              Distribución de impactos
            </h3>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arrowDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis dataKey="score" stroke="#94a3b8" />

                <YAxis stroke="#94a3b8" />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#22d3ee"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
