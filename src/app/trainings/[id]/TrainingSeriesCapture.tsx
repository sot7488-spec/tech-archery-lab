"use client";

import { useActionState, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { TargetScoringBoard } from "@/components/target-scoring-board";
import { createSeriesWithArrowsState } from "./actions";

type Props = {
  trainingId: string;
  roundId: string;
  distanceMeters: number;
  targetSizeCm: number;
  arrowsPerSeries: number;
};

const initialState = {
  completed: false,
  trainingSessionId: "",
  error: "",
};

export default function TrainingSeriesCapture({
  trainingId,
  roundId,
  distanceMeters,
  targetSizeCm,
  arrowsPerSeries,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createSeriesWithArrowsState,
    initialState
  );
  const [boardVersion, setBoardVersion] = useState(0);

  useEffect(() => {
    if (state.savedAt && !state.error) {
      setBoardVersion((version) => version + 1);
    }
  }, [state.savedAt, state.error]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="training_session_id" value={trainingId} />
      <input type="hidden" name="round_id" value={roundId} />
      <input type="hidden" name="distance_meters" value={distanceMeters} />
      <input type="hidden" name="target_size_cm" value={targetSizeCm} />
      <input type="hidden" name="arrows_per_series" value={arrowsPerSeries} />

      <div className="mx-auto w-full max-w-[760px]">
        <TargetScoringBoard key={boardVersion} arrowCount={arrowsPerSeries} />
      </div>

      {state.error && (
        <div className="mx-auto max-w-[600px] rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          {state.error}
        </div>
      )}

      {state.message && !state.error && (
        <div className="mx-auto max-w-[600px] rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
          {state.message}
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
  );
}
