export const dynamic = "force-dynamic";

import { TargetScoringBoard } from "@/components/target-scoring-board";
import { createSeriesWithArrows, finishTraining } from "./actions";
import { TargetHeatmap } from "@/components/target-heatmap";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: training, error } = await supabase
    .from("training_sessions")
    .select(`
      *,
      equipment_profiles (
        id,
        name
      ),
      athlete_profiles (
        id,
        category,
        bow_type,
        users!athlete_profiles_user_id_fkey (
          name,
          email
        )
      ),
      training_rounds (
        *,
        series (
          *,
          arrows (
            *
          )
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !training) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <Link href="/trainings" className="font-bold text-cyan-300">
          ← Volver a entrenamientos
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-6 text-slate-950 shadow-xl">
          <h1 className="text-2xl font-black text-red-600">
            Entrenamiento no encontrado
          </h1>

          <pre className="mt-4 text-sm text-red-500">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const currentRound = training.training_rounds?.[0];

  const allTrainingArrows =
    training.training_rounds?.flatMap((round: any) =>
      round.series?.flatMap((serie: any) => serie.arrows || []) || []
    ) || [];

  const totalSeries =
    training.training_rounds?.reduce(
      (sum: number, round: any) => sum + (round.series?.length || 0),
      0
    ) || 0;

  const plannedSeries = currentRound?.total_series || 0;
  const arrowsPerSeries = currentRound?.arrows_per_series || 6;
  const plannedArrows = plannedSeries * arrowsPerSeries;
  const totalArrows = allTrainingArrows.length;
  const totalScore = training.total_score || 0;

  const averageArrow =
    totalArrows > 0 ? (totalScore / totalArrows).toFixed(1) : "0.0";

  const xCount = allTrainingArrows.filter((arrow: any) => arrow.is_x).length;

  const missCount = allTrainingArrows.filter(
    (arrow: any) => Number(arrow.score || 0) === 0
  ).length;

  const isCompleted = training.status === "completed";

  const configCardClass =
    "rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/trainings"
            className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            ← Volver a entrenamientos
          </Link>

          <span
            className={`rounded-2xl px-4 py-2 text-sm font-black uppercase ${
              isCompleted
                ? "bg-emerald-400 text-slate-950"
                : "bg-yellow-300 text-slate-950"
            }`}
          >
            {isCompleted ? "Finalizado" : "En progreso"}
          </span>
        </div>

        <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-8 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
            TAL Training Session
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                {training.athlete_profiles?.users?.name}
              </h1>

              <p className="mt-3 text-slate-300">
                {training.training_date} ·{" "}
                {training.location || "Sin ubicación"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
                  {training.session_type || "Entrenamiento"}
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
                  {training.athlete_profiles?.category || "Sin categoría"}
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">
                  {training.athlete_profiles?.bow_type || "Arco"}
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-cyan-400 px-6 py-4 text-slate-950 shadow-xl shadow-cyan-500/20">
              <p className="text-xs font-black uppercase">Score total</p>
              <p className="text-5xl font-black">{totalScore}</p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Series</p>
            <p className="mt-2 text-4xl font-black">
              {totalSeries}
              {plannedSeries ? (
                <span className="text-lg text-slate-400">/{plannedSeries}</span>
              ) : null}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Flechas</p>
            <p className="mt-2 text-4xl font-black">
              {totalArrows}
              {plannedArrows ? (
                <span className="text-lg text-slate-400">/{plannedArrows}</span>
              ) : null}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Promedio</p>
            <p className="mt-2 text-4xl font-black">{averageArrow}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">X / Miss</p>
            <p className="mt-2 text-4xl font-black">
              {xCount}/{missCount}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-[2.5rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Configuración del entrenamiento
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Parámetros de sesión
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Esta configuración se definió al crear el entrenamiento y se usa
              para todas las series registradas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-6">
            <div className={configCardClass}>
              <p className="text-sm font-bold text-slate-400">Distancia</p>
              <h3 className="mt-2 text-3xl font-black text-cyan-300">
                {currentRound?.distance_meters || "-"} m
              </h3>
            </div>

            <div className={configCardClass}>
              <p className="text-sm font-bold text-slate-400">Diana</p>
              <h3 className="mt-2 text-3xl font-black text-cyan-300">
                {currentRound?.target_size_cm || "-"} cm
              </h3>
            </div>

            <div className={configCardClass}>
              <p className="text-sm font-bold text-slate-400">
                Series planeadas
              </p>
              <h3 className="mt-2 text-3xl font-black text-cyan-300">
                {plannedSeries || "-"}
              </h3>
            </div>

            <div className={configCardClass}>
              <p className="text-sm font-bold text-slate-400">
                Flechas / serie
              </p>
              <h3 className="mt-2 text-3xl font-black text-cyan-300">
                {arrowsPerSeries}
              </h3>
            </div>

            <div className={configCardClass}>
              <p className="text-sm font-bold text-slate-400">Brace height</p>
              <h3 className="mt-2 text-3xl font-black text-cyan-300">
                {training.brace_height_cm || "-"} cm
              </h3>
            </div>

            <div className={configCardClass}>
              <p className="text-sm font-bold text-slate-400">Equipo</p>
              <h3 className="mt-2 text-lg font-black text-white">
                {training.equipment_profiles?.name || "Sin equipo"}
              </h3>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
            <p className="text-sm font-bold text-slate-400">Clima</p>
            <h2 className="mt-2 text-2xl font-black">
              {training.weather || "-"}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
            <p className="text-sm font-bold text-slate-400">Viento</p>
            <h2 className="mt-2 text-2xl font-black">
              {training.wind_speed_kmh || 0} km/h
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
            <p className="text-sm font-bold text-slate-400">Temperatura</p>
            <h2 className="mt-2 text-2xl font-black">
              {training.temperature_c || 0} °C
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
            <p className="text-sm font-bold text-slate-400">Estado</p>
            <h2 className="mt-2 text-2xl font-black">
              {training.status || "draft"}
            </h2>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-xl">
            <h3 className="text-xl font-black">Objetivo</h3>
            <p className="mt-3 text-slate-600">
              {training.objective || "Sin objetivo registrado."}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-xl">
            <h3 className="text-xl font-black">Notas del entrenador</h3>
            <p className="mt-3 text-slate-600">
              {training.coach_notes || "Sin notas registradas."}
            </p>
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-white/[0.04] p-5 text-white shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-6">
          <div className="mb-5 border-b border-white/10 pb-5">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Scoring Input
            </p>

            <h3 className="mt-2 text-3xl font-black">Registrar serie</h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Captura score e impacto por flecha. La distancia, diana y número
              de series ya están definidos en la configuración del entrenamiento.
            </p>
          </div>

          {isCompleted ? (
            <p className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-medium text-slate-400">
              Este entrenamiento ya fue finalizado. No se pueden agregar más
              series.
            </p>
          ) : (
            <>
              <form action={createSeriesWithArrows} className="space-y-5">
                <input
                  type="hidden"
                  name="training_session_id"
                  value={training.id}
                />

                <input
                  type="hidden"
                  name="distance_meters"
                  value={currentRound?.distance_meters || 0}
                />

                <input
                  type="hidden"
                  name="target_size_cm"
                  value={currentRound?.target_size_cm || 0}
                />

                <div className="mx-auto w-full max-w-[700px]">
                  <TargetScoringBoard />
                </div>

                <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3 pt-2">
                  <button className="w-full rounded-2xl bg-cyan-400 p-4 text-lg font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-300">
                    Guardar serie
                  </button>
                </div>
              </form>

              <form
                action={finishTraining}
                className="mx-auto mt-3 w-full max-w-[600px]"
              >
                <input
                  type="hidden"
                  name="training_session_id"
                  value={training.id}
                />

                <button className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white">
                  Finalizar entrenamiento
                </button>
              </form>
            </>
          )}
        </section>

        <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 p-6 text-white shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Session History
              </p>

              <h3 className="mt-2 text-3xl font-black tracking-tight">
                Series registradas
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Historial completo de puntuaciones y agrupaciones.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                Rondas
              </p>

              <p className="text-4xl font-black text-white">
                {training.training_rounds?.length || 0}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {training.training_rounds?.map((round: any) => (
              <div
                key={round.id}
                className="relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-cyan-400/5 blur-3xl" />

                <div className="relative z-10 mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      Configuración
                    </p>

                    <h4 className="mt-2 text-2xl font-black">
                      {round.distance_meters} m · Diana{" "}
                      {round.target_size_cm || "-"} cm ·{" "}
                      {round.series?.length || 0}/{round.total_series || "-"}{" "}
                      series
                    </h4>
                  </div>

                  <div className="flex gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Series
                      </p>

                      <p className="mt-1 text-3xl font-black text-white">
                        {round.series?.length || 0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                        Score
                      </p>

                      <p className="mt-1 text-3xl font-black text-white">
                        {round.series?.reduce(
                          (sum: number, serie: any) =>
                            sum + Number(serie.total_score || 0),
                          0
                        ) || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {round.series?.map((serie: any) => (
                    <div
                      key={serie.id}
                      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-50" />

                      <div className="relative z-10 mb-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                            Serie
                          </p>

                          <h5 className="mt-1 text-2xl font-black">
                            #{serie.series_number}
                          </h5>
                        </div>

                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 shadow-lg shadow-cyan-500/10">
                          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                            Total
                          </p>

                          <p className="mt-1 text-3xl font-black text-white">
                            {serie.total_score}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                        {serie.arrows?.map((arrow: any, index: number) => {
                          const displayValue = arrow.is_x
                            ? "X"
                            : arrow.score === 0
                            ? "M"
                            : arrow.score;

                          const isX = displayValue === "X";
                          const isMiss = displayValue === "M";

                          return (
                            <div
                              key={arrow.id}
                              className={`group relative overflow-hidden rounded-2xl border p-4 text-center transition-all hover:-translate-y-1 ${
                                isX
                                  ? "border-yellow-300/30 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.2)]"
                                  : isMiss
                                  ? "border-red-400/20 bg-red-500/10"
                                  : "border-white/10 bg-white/[0.04]"
                              }`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />

                              <div className="relative z-10">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                  F{index + 1}
                                </p>

                                <p
                                  className={`mt-2 text-4xl font-black ${
                                    isX
                                      ? "text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.75)]"
                                      : isMiss
                                      ? "text-red-300"
                                      : "text-white"
                                  }`}
                                >
                                  {displayValue}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {(!training.training_rounds ||
              training.training_rounds.length === 0) && (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="text-lg font-bold text-slate-400">
                  Aún no hay series registradas.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Comienza capturando la primera serie del entrenamiento.
                </p>
              </div>
            )}
          </div>
        </section>

        <section>
          <TargetHeatmap arrows={allTrainingArrows} />
        </section>
      </div>
    </main>
  );
}