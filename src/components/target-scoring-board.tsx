"use client";

import { useState } from "react";

type ArrowPosition = {
  x: number;
  y: number;
};

function calculateScore(x: number, y: number) {
  const distance = Math.sqrt(x * x + y * y);

  if (distance <= 5) return "X";
  if (distance <= 7) return "10";
  if (distance <= 13) return "9";
  if (distance <= 17) return "8";
  if (distance <= 22) return "7";
  if (distance <= 28) return "6";
  if (distance <= 33) return "5";
  if (distance <= 38) return "4";
  if (distance <= 43) return "3";
  if (distance <= 48) return "2";
  if (distance <= 53) return "1";

  return "M";
}

export function TargetScoringBoard() {
  const [positions, setPositions] = useState<Record<number, ArrowPosition>>({});
  const [scores, setScores] = useState<Record<number, string>>({});
  const [activeArrow, setActiveArrow] = useState(1);

  function handleTargetClick(e: React.MouseEvent<HTMLDivElement>) {
    if (activeArrow > 6) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    const x = Number((percentX - 50).toFixed(2));
    const y = Number((50 - percentY).toFixed(2));

    const score = calculateScore(x, y);

    setPositions((prev) => ({
      ...prev,
      [activeArrow]: { x, y },
    }));

    setScores((prev) => ({
      ...prev,
      [activeArrow]: score,
    }));

    if (activeArrow < 6) {
      setActiveArrow(activeArrow + 1);
    }
  }

  function clearArrow(n: number) {
    setPositions((prev) => {
      const copy = { ...prev };
      delete copy[n];
      return copy;
    });

    setScores((prev) => {
      const copy = { ...prev };
      delete copy[n];
      return copy;
    });

    setActiveArrow(n);
  }

  function clearAll() {
    setPositions({});
    setScores({});
    setActiveArrow(1);
  }

  const registeredCount = Object.keys(positions).length;

  return (
    <div className="w-full">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n}>
          <input
            type="hidden"
            name={`position_x_${n}`}
            value={positions[n]?.x ?? ""}
          />
          <input
            type="hidden"
            name={`position_y_${n}`}
            value={positions[n]?.y ?? ""}
          />
        </div>
      ))}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        <section className="rounded-[2rem] border border-cyan-400/10 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
            Serie actual
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            Registro de flechas
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Haz clic en la diana para registrar score e impacto.
          </p>

          <div className="mt-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className={`rounded-2xl border p-3 transition ${
                  activeArrow === n
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-300">
                    F{n}
                  </div>

                  <input
                    name={`arrow_${n}`}
                    type="text"
                    value={scores[n] || ""}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [n]: e.target.value.toUpperCase(),
                      }))
                    }
                    inputMode="text"
                    pattern="^(X|x|M|m|10|[1-9])$"
                    placeholder="Score"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-center text-base font-black uppercase text-white outline-none placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    required
                  />
                </div>

                {positions[n] && (
                  <button
                    type="button"
                    onClick={() => clearArrow(n)}
                    className="mt-2 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 hover:bg-red-500/20"
                  >
                    Limpiar flecha {n}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Impactos
              </p>
              <p className="mt-1 text-3xl font-black text-white">
                {registeredCount}/6
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                Activa
              </p>
              <p className="mt-1 text-3xl font-black text-cyan-300">
                F{activeArrow}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-300 hover:bg-white/10"
          >
            Reiniciar serie
          </button>
        </section>

        <section className="rounded-[2rem] border border-cyan-400/10 bg-slate-950/80 p-5 shadow-[0_0_50px_rgba(34,211,238,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                Target Input
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">
                Diana interactiva
              </h3>
            </div>

            <span className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
              Clic para F{activeArrow}
            </span>
          </div>

          <div
            onClick={handleTargetClick}
            className="relative mx-auto aspect-square w-full max-w-[560px] cursor-crosshair rounded-full border border-cyan-400/20 bg-slate-950 p-4 shadow-[0_0_70px_rgba(34,211,238,0.18)]"
          >
            <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl" />

            <div className="relative h-full w-full overflow-hidden rounded-full border border-white/10 bg-white shadow-2xl">
              <div className="absolute inset-0 rounded-full border border-neutral-300 bg-white shadow-inner" />
              <div className="absolute inset-[7%] rounded-full border-2 border-neutral-700 bg-black shadow-[0_0_25px_rgba(0,0,0,0.55)]" />
              <div className="absolute inset-[17%] rounded-full border-2 border-sky-300 bg-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.45)]" />
              <div className="absolute inset-[27%] rounded-full border-2 border-red-300 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.45)]" />
              <div className="absolute inset-[37%] rounded-full border-4 border-yellow-100 bg-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.85)]" />
              <div className="absolute inset-[46%] rounded-full border-4 border-yellow-50 bg-yellow-200 shadow-[0_0_45px_rgba(255,255,255,0.95)]" />

              <div className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2 bg-slate-950/30" />
              <div className="absolute left-0 top-1/2 z-10 h-px w-full -translate-y-1/2 bg-slate-950/30" />

              <div className="absolute left-1/2 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950/50 bg-yellow-200/30" />

              {Object.entries(positions).map(([arrow, position]) => (
                <div
                  key={arrow}
                  className="absolute z-20 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-cyan-400 text-[8px] font-black text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.75)]"
                  style={{
                    left: `${50 + position.x}%`,
                    top: `${50 - position.y}%`,
                  }}
                >
                  {arrow}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}