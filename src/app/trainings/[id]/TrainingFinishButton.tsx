"use client";

import { useActionState } from "react";
import { CheckCircle2, ListChecks } from "lucide-react";
import { finishTrainingState } from "./actions";

const initialState = {
  success: false,
  error: "",
  pendingItems: [] as string[],
};

export default function TrainingFinishButton({
  trainingId,
  isCompleted,
}: {
  trainingId: string;
  isCompleted: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    finishTrainingState,
    initialState
  );

  if (isCompleted) return null;

  return (
    <form
      action={formAction}
      className="rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.035] p-5 shadow-xl shadow-cyan-950/20"
    >
      <input type="hidden" name="training_session_id" value={trainingId} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Cierre general
          </p>
          <h3 className="mt-1 text-2xl font-black text-white">
            Finalizar entrenamiento
          </h3>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Primero finaliza cada ronda y rutina con su retroalimentacion.
          </p>
        </div>

        <button
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={17} />
          {pending ? "Validando..." : "Finalizar entrenamiento"}
        </button>
      </div>

      {state.error && (
        <div className="mt-4 rounded-2xl border border-yellow-300/30 bg-yellow-400/10 p-4 text-yellow-100">
          <p className="flex items-center gap-2 text-sm font-black">
            <ListChecks size={16} />
            {state.error}
          </p>

          {state.pendingItems?.length ? (
            <ul className="mt-3 list-inside list-disc text-sm font-bold text-yellow-50/90">
              {state.pendingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {state.success && (
        <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">
          Entrenamiento finalizado.
        </p>
      )}
    </form>
  );
}
