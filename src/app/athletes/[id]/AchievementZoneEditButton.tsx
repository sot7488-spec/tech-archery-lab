"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Crosshair, Pencil, Save, X } from "lucide-react";
import { updateAthleteAchievementZone } from "../actions";

type Props = {
  athleteId: string;
  minScore: number;
  maxScore: number;
};

export default function AchievementZoneEditButton({
  athleteId,
  minScore,
  maxScore,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(formData: FormData) {
    await updateAthleteAchievementZone(formData);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300 hover:text-slate-950"
        aria-label="Editar zona de logro"
        title="Editar zona de logro"
      >
        <Pencil size={15} />
      </button>

      {open &&
        mounted &&
        createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-5 backdrop-blur-xl">
          <div className="relative w-full max-w-lg rounded-[2rem] border border-cyan-300/20 bg-slate-950 p-6 text-white shadow-[0_0_90px_rgba(34,211,238,0.16)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <Crosshair size={26} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                Zona de logro
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Define el rango objetivo
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                La efectividad se calcula con flechas puntuadas que caen dentro
                del rango configurado.
              </p>
            </div>

            <form action={handleSubmit} className="space-y-5">
              <input type="hidden" name="athlete_id" value={athleteId} />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Desde
                  </span>
                  <input
                    type="number"
                    name="achievement_zone_min_score"
                    min={0}
                    max={10}
                    required
                    defaultValue={minScore}
                    className="tal-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Hasta
                  </span>
                  <input
                    type="number"
                    name="achievement_zone_max_score"
                    min={0}
                    max={10}
                    required
                    defaultValue={maxScore}
                    className="tal-input"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm font-bold leading-6 text-cyan-50">
                Ejemplos utiles: 9-10 para precision alta, 7-10 para
                consistencia general o 10-10 para medir solo dieces.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/20"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  <Save size={16} />
                  Guardar zona
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
