import { Brain, Sparkles } from "lucide-react";

type Props = {
  accuracy: number;
  averageScore: number;
  xCount: number;
  totalArrows: number;
  trainingsCount: number;
};

export function AnalyticsInsights({
  accuracy,
  averageScore,
  xCount,
  totalArrows,
  trainingsCount,
}: Props) {
  const xRate =
    totalArrows > 0
      ? ((xCount / totalArrows) * 100).toFixed(1)
      : "0";

  const insights: {
    title: string;
    description: string;
    color: string;
  }[] = [];

  if (accuracy >= 85) {
    insights.push({
      title: "Alta precisión",
      description:
        "El atleta mantiene una precisión sobresaliente y agrupaciones consistentes.",
      color: "cyan",
    });
  } else if (accuracy >= 70) {
    insights.push({
      title: "Precisión estable",
      description:
        "El rendimiento general es bueno, aunque existe margen para mejorar agrupación.",
      color: "yellow",
    });
  } else {
    insights.push({
      title: "Precisión baja",
      description:
        "Existe dispersión considerable. Se recomienda revisar técnica base y consistencia.",
      color: "red",
    });
  }

  if (averageScore >= 9) {
    insights.push({
      title: "Nivel competitivo",
      description:
        "El promedio por flecha refleja desempeño de nivel competitivo.",
      color: "cyan",
    });
  }

  if (Number(xRate) >= 15) {
    insights.push({
      title: "Excelente ejecución",
      description:
        "La cantidad de impactos X indica gran control técnico y estabilidad.",
      color: "yellow",
    });
  }

  if (trainingsCount >= 10) {
    insights.push({
      title: "Alta actividad",
      description:
        "El volumen de entrenamientos permite generar analíticas más precisas.",
      color: "cyan",
    });
  }

  const colorClasses: any = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    yellow: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
    red: "border-red-400/20 bg-red-500/10 text-red-300",
  };

  return (
    <section className="mt-8 tal-hero-panel p-6">
      <div className="mb-6">
        <span className="tal-metric-icon">
          <Brain size={20} />
        </span>
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          TAL Coach AI
        </p>

        <h2 className="mt-2 text-3xl font-black">
          Insights automáticos
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Interpretación automática del rendimiento deportivo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`tal-metric-card border ${colorClasses[insight.color]}`}
          >
            <span className="tal-metric-icon">
              <Sparkles size={20} />
            </span>
            <h3 className="relative z-10 text-xl font-black">
              {insight.title}
            </h3>

            <p className="relative z-10 mt-3 text-sm leading-6 text-slate-200">
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
