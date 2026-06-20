"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import { finishTrainingRoundState } from "./actions";

type Props = {
  roundId: string;
  scoringEnabled: boolean;
  completedSeries: number;
  plannedSeries: number;
};

const initialState = {
  success: false,
  error: "",
};

export default function TrainingRoundFinalizeForm({
  roundId,
  scoringEnabled,
  completedSeries,
  plannedSeries,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    finishTrainingRoundState,
    initialState
  );
  const canFinish =
    !scoringEnabled || !plannedSeries || completedSeries >= plannedSeries;

  useEffect(() => {
    if (state.success && !state.error) {
      router.refresh();
    }
  }, [router, state.success, state.error]);

  return (
    <form action={formAction} className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
      <input type="hidden" name="round_id" value={roundId} />

      <label className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
        <FileText size={15} />
        Retroalimentacion de ronda
      </label>

      <textarea
        name="feedback"
        rows={4}
        className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] p-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
        placeholder={
          scoringEnabled
            ? "Observaciones tecnicas, sensaciones, ajuste principal..."
            : "Retroalimentacion de la ronda sin puntuacion..."
        }
        required
      />

      {state.error && (
        <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">
          Ronda finalizada.
        </p>
      )}

      <button
        disabled={pending || !canFinish}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle2 size={17} />
        {pending ? "Finalizando..." : "Finalizar ronda"}
      </button>

      {!canFinish && (
        <p className="mt-3 text-xs font-bold text-slate-500">
          Completa las {plannedSeries} series antes de finalizar esta ronda.
        </p>
      )}
    </form>
  );
}
