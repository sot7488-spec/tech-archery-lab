import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { AnalysisMetric } from "@/lib/video-analysis-v2/analysis-engine";
import type { MetricStatus } from "@/lib/video-analysis-v2/thresholds";

const statusStyles: Record<MetricStatus, string> = {
  good: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  warning: "border-yellow-300/20 bg-yellow-300/10 text-yellow-100",
  bad: "border-red-300/20 bg-red-300/10 text-red-100",
};

const statusIcon = {
  good: CheckCircle2,
  warning: AlertTriangle,
  bad: XCircle,
};

export function AnalysisMetrics({ metrics }: { metrics: AnalysisMetric[] }) {
  if (!metrics.length) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-sm font-bold text-slate-400">
        Reproduce el video para generar metricas tecnicas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = statusIcon[metric.status] || Activity;

        return (
          <article
            key={metric.key}
            className={`rounded-[1.4rem] border p-4 ${statusStyles[metric.status]}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/45">
                <Icon size={19} />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                {metric.status === "good"
                  ? "Correcto"
                  : metric.status === "warning"
                    ? "Revisar"
                    : "Corregir"}
              </span>
            </div>

            <h3 className="text-sm font-black text-white">{metric.label}</h3>
            <p className="mt-2 text-3xl font-black">
              {metric.value}
              <span className="ml-1 text-sm">{metric.unit}</span>
            </p>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-300">
              {metric.description}
            </p>
          </article>
        );
      })}
    </div>
  );
}
