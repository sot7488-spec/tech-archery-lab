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

export function AthleteCharts({
  trainingChartData,
  xChartData,
}: {
  trainingChartData: any[];
  xChartData: any[];
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <div className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-xl font-bold mb-4">
          Evolución del promedio
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trainingChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="average"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow">
        <h3 className="text-xl font-bold mb-4">
          X por entrenamiento
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={xChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="xCount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}