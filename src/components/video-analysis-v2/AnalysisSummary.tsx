import { Brain, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { ComponentType } from "react";
import type { VideoAnalysisResult } from "@/lib/video-analysis-v2/analysis-engine";

function SummaryList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <p className={`text-xs font-black uppercase tracking-[0.22em] ${tone}`}>
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <p key={index} className="text-sm font-bold leading-6 text-slate-300">
              {item}
            </p>
          ))
        ) : (
          <p className="text-sm font-bold text-slate-500">Sin datos suficientes.</p>
        )}
      </div>
    </div>
  );
}

export function AnalysisSummary({
  result,
}: {
  result: VideoAnalysisResult;
}) {
  return (
    <section className="grid gap-4">
      <div className="rounded-[1.7rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Resultado TAL
              </p>
              <h2 className="text-2xl font-black text-white">Score tecnico</h2>
            </div>
          </div>

          <p className="text-6xl font-black text-white">{result.score}</p>
        </div>

        <p className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm font-bold leading-6 text-yellow-50">
          Este analisis es una referencia visual asistida por IA. La evaluacion
          final debe ser realizada por el entrenador.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryList
          title="Fortalezas"
          items={result.strengths}
          tone="text-emerald-300"
        />
        <SummaryList
          title="Puntos a corregir"
          items={result.corrections}
          tone="text-red-300"
        />
        <SummaryList
          title="Recomendacion"
          items={result.recommendations}
          tone="text-cyan-300"
        />
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-cyan-300" />
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Observaciones automaticas
          </p>
        </div>
        <div className="grid gap-2">
          {result.observations.map((observation, index) => (
            <p key={index} className="text-sm font-bold leading-6 text-slate-300">
              {observation}
            </p>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniPrinciple icon={Target} label="Postura" />
        <MiniPrinciple icon={ActivityIcon} label="Expansion" />
        <MiniPrinciple icon={Brain} label="Follow-through" />
      </div>
    </section>
  );
}

function ActivityIcon({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <Sparkles size={size} className={className} />;
}

function MiniPrinciple({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center gap-2">
        <Icon size={17} className="text-cyan-300" />
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white">
          {label}
        </span>
      </div>
    </div>
  );
}
