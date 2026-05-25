"use client";

export function TargetHeatmap({ arrows }: { arrows: any[] }) {
  const positionedArrows =
    arrows?.filter(
      (arrow) => arrow.position_x !== null && arrow.position_y !== null
    ) || [];

  return (
    <div className="rounded-[28px] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-5 shadow-2xl">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Target Analysis
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            Heatmap de agrupación
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Visualización de impactos registrados sobre la diana.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
            Impactos
          </p>
          <p className="text-3xl font-black text-white">
            {positionedArrows.length}
          </p>
        </div>
      </div>

      <div className="relative mx-auto aspect-square max-w-[440px] rounded-full border border-cyan-400/20 bg-slate-950 p-4 shadow-[0_0_50px_rgba(34,211,238,0.18)]">
        <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative h-full w-full overflow-hidden rounded-full border border-white/10 bg-white shadow-2xl">
          <div className="absolute inset-0 rounded-full bg-white" />
          <div className="absolute inset-[7%] rounded-full bg-neutral-950" />
          <div className="absolute inset-[17%] rounded-full bg-sky-500" />
          <div className="absolute inset-[27%] rounded-full bg-red-600" />
          <div className="absolute inset-[37%] rounded-full bg-yellow-300" />

          <div className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2 bg-slate-950/30" />
          <div className="absolute left-0 top-1/2 z-10 h-px w-full -translate-y-1/2 bg-slate-950/30" />

          <div className="absolute left-1/2 top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950/50" />

          {positionedArrows.map((arrow) => (
            <div
              key={arrow.id}
              className="absolute z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-cyan-400 text-[10px] font-black text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.75)]"
              style={{
                left: `${50 + Number(arrow.position_x)}%`,
                top: `${50 - Number(arrow.position_y)}%`,
              }}
              title={`Flecha ${arrow.arrow_number}: ${
                arrow.is_x ? "X" : arrow.score
              }`}
            >
              {arrow.arrow_number || ""}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Posiciones
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {positionedArrows.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Total flechas
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {arrows?.length || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Registro
          </p>
          <p className="mt-1 text-2xl font-black text-cyan-300">
            {arrows?.length
              ? `${Math.round((positionedArrows.length / arrows.length) * 100)}%`
              : "0%"}
          </p>
        </div>
      </div>
    </div>
  );
}