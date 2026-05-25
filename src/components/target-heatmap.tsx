"use client";

export function TargetHeatmap({ arrows }: { arrows: any[] }) {
  const positionedArrows =
    arrows?.filter(
      (arrow) => arrow.position_x !== null && arrow.position_y !== null
    ) || [];

  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <h3 className="text-xl font-bold mb-4">Heatmap de agrupación</h3>

      <div className="relative mx-auto aspect-square max-w-[420px] rounded-full bg-white shadow-lg overflow-hidden">
        <div className="absolute inset-0 rounded-full bg-white" />
        <div className="absolute inset-[7%] rounded-full bg-neutral-900" />
        <div className="absolute inset-[17%] rounded-full bg-sky-500" />
        <div className="absolute inset-[27%] rounded-full bg-orange-600" />
        <div className="absolute inset-[37%] rounded-full bg-yellow-300" />

        {positionedArrows.map((arrow) => (
          <div
            key={arrow.id}
            className="absolute z-20 w-4 h-4 -ml-2 -mt-2 rounded-full bg-cyan-400 border-2 border-white shadow"
            style={{
              left: `${50 + Number(arrow.position_x)}%`,
              top: `${50 - Number(arrow.position_y)}%`,
            }}
            title={`Flecha ${arrow.arrow_number}: ${
              arrow.is_x ? "X" : arrow.score
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-slate-500 mt-4">
        Flechas con posición registrada: {positionedArrows.length}
      </p>
    </div>
  );
}