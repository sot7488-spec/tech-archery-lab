"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, FileText, Save, X } from "lucide-react";
import { TargetScoringBoard } from "@/components/target-scoring-board";
import {
  createSeriesWithArrowsState,
  finishTraining,
  updateTrainingCloseNotes,
} from "./actions";

type Props = {
  trainingId: string;
  distanceMeters: number;
  targetSizeCm: number;
  existingCoachNotes?: string | null;
};

const initialState = {
  completed: false,
  trainingSessionId: "",
  error: "",
};

export default function TrainingSeriesCapture({
  trainingId,
  distanceMeters,
  targetSizeCm,
  existingCoachNotes = "",
}: Props) {
  const [state, formAction, pending] = useActionState(
    createSeriesWithArrowsState,
    initialState
  );
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    if (state.completed) {
      setNotesOpen(true);
    }
  }, [state.completed]);

  return (
    <>
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="training_session_id" value={trainingId} />
        <input type="hidden" name="distance_meters" value={distanceMeters} />
        <input type="hidden" name="target_size_cm" value={targetSizeCm} />

        <div className="mx-auto w-full max-w-[760px]">
          <TargetScoringBoard />
        </div>

        {state.error && (
          <div className="mx-auto max-w-[600px] rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
            {state.error}
          </div>
        )}

        <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3 pt-2">
          <button
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 p-4 text-lg font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {pending ? "Guardando..." : "Guardar serie"}
          </button>
        </div>
      </form>

      <form action={finishTraining} className="mx-auto mt-3 w-full max-w-[600px]">
        <input type="hidden" name="training_session_id" value={trainingId} />

        <button className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white">
          Finalizar entrenamiento
        </button>
      </form>

      {notesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950 p-6 text-white shadow-[0_0_90px_rgba(34,211,238,0.20)]">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="tal-metric-icon mb-0">
                  <CheckCircle2 size={22} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                    Sesion completada
                  </p>
                  <h2 className="mt-2 text-3xl font-black tal-text-glow">
                    Agregar notas finales
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Se guardo la ultima serie y el entrenamiento fue finalizado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotesOpen(false)}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form action={updateTrainingCloseNotes} className="relative z-10 mt-6">
              <input type="hidden" name="training_session_id" value={trainingId} />

              <label className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                <FileText size={15} />
                Notas del entrenador
              </label>

              <textarea
                name="coach_notes"
                defaultValue={existingCoachNotes || ""}
                rows={6}
                className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] p-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                placeholder="Resumen final, observaciones tecnicas, puntos a mejorar..."
              />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setNotesOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                >
                  Omitir
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)] transition hover:-translate-y-0.5 hover:bg-cyan-300">
                  <Save size={16} />
                  Guardar notas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
