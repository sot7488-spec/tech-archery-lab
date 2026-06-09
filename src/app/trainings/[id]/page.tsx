export const dynamic = "force-dynamic";

import { TargetHeatmap } from "@/components/target-heatmap";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TrainingSeriesCapture from "./TrainingSeriesCapture";
import TrainingRoundFinalizeForm from "./TrainingRoundFinalizeForm";
import TrainingDeleteButton from "../TrainingDeleteButton";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BowArrow,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Crosshair,
  FileText,
  Gauge,
  MapPin,
  NotebookText,
  Ruler,
  Target,
  Thermometer,
  Trophy,
  Wind,
  type LucideIcon,
} from "lucide-react";

function getRelationName(relation: any) {
  if (Array.isArray(relation)) return relation[0]?.name || "Atleta sin nombre";
  return relation?.name || "Atleta sin nombre";
}

function valueOrDash(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function arrowDisplay(arrow: any) {
  if (!arrow) return "";
  if (arrow.is_x) return "X";
  if (Number(arrow.score || 0) === 0) return "M";
  return String(arrow.score);
}

function calculateGroupSizeCm(arrows: any[], targetSizeCm: number) {
  const positionedArrows = arrows.filter(
    (arrow) =>
      arrow.position_x !== null &&
      arrow.position_x !== undefined &&
      arrow.position_y !== null &&
      arrow.position_y !== undefined
  );

  if (positionedArrows.length < 2 || !targetSizeCm) return null;

  let maxDistancePercent = 0;

  for (let i = 0; i < positionedArrows.length; i += 1) {
    for (let j = i + 1; j < positionedArrows.length; j += 1) {
      const dx =
        Number(positionedArrows[i].position_x) -
        Number(positionedArrows[j].position_x);
      const dy =
        Number(positionedArrows[i].position_y) -
        Number(positionedArrows[j].position_y);

      maxDistancePercent = Math.max(
        maxDistancePercent,
        Math.sqrt(dx * dx + dy * dy)
      );
    }
  }

  return Number(((maxDistancePercent / 100) * targetSizeCm).toFixed(1));
}

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

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
        user_id,
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
      ),
      training_routine_blocks (
        *
      )
    `)
    .eq("id", id)
    .single();

  if (error || !training) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <Link href="/trainings" className="font-bold text-cyan-300">
          Volver a entrenamientos
        </Link>

        <div className="tal-chart-card mt-6">
          <h1 className="text-2xl font-black text-red-300">
            Entrenamiento no encontrado
          </h1>

          <pre className="mt-4 overflow-auto text-sm text-red-300">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  if (
    currentUser?.role === "coach" &&
    training.club_id !== currentUser.club_id
  ) {
    redirect("/trainings");
  }

  if (
    currentUser?.role === "athlete" &&
    training.athlete_profiles?.user_id !== user.id
  ) {
    redirect("/trainings");
  }

  const trainingRounds = [...(training.training_rounds || [])].sort(
    (a: any, b: any) => Number(a.round_number || 0) - Number(b.round_number || 0)
  );
  const routineBlocks = [...(training.training_routine_blocks || [])].sort(
    (a: any, b: any) =>
      Number(a.routine_number || 0) - Number(b.routine_number || 0)
  );
  const currentRound =
    trainingRounds.find((round: any) => round.status !== "completed") ||
    trainingRounds[0];

  const allTrainingArrows =
    trainingRounds
      .filter((round: any) => round.scoring_enabled !== false)
      .flatMap((round: any) =>
        round.series?.flatMap((serie: any) => serie.arrows || []) || []
      ) || [];

  const totalSeries =
    trainingRounds.reduce(
      (sum: number, round: any) =>
        round.scoring_enabled === false
          ? sum
          : sum + (round.series?.length || 0),
      0
    ) || 0;

  const plannedSeries =
    trainingRounds.reduce(
      (sum: number, round: any) =>
        round.scoring_enabled === false
          ? sum
          : sum + Number(round.total_series || 0),
      0
    ) || 0;
  const arrowsPerSeries = currentRound?.arrows_per_series || 6;
  const plannedArrows =
    trainingRounds.reduce(
      (sum: number, round: any) =>
        round.scoring_enabled === false
          ? sum
          : sum +
            Number(round.total_series || 0) *
              Number(round.arrows_per_series || 0),
      0
    ) || 0;
  const totalArrows = allTrainingArrows.length;
  const totalScore = training.total_score || 0;
  const averageArrow =
    totalArrows > 0 ? (totalScore / totalArrows).toFixed(1) : "0.0";
  const xCount = allTrainingArrows.filter((arrow: any) => arrow.is_x).length;
  const missCount = allTrainingArrows.filter(
    (arrow: any) => Number(arrow.score || 0) === 0
  ).length;
  const isCompleted = training.status === "completed";
  const canDeleteTraining =
    currentUser?.role === "admin" || currentUser?.role === "coach";
  const athleteName = getRelationName(training.athlete_profiles?.users);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 tal-grid-bg opacity-20" />
      <div className="absolute right-[-200px] top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-120px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/trainings"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} />
            Entrenamientos
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {canDeleteTraining && (
              <TrainingDeleteButton trainingId={training.id} />
            )}

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black uppercase ${
                isCompleted
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-yellow-300 text-slate-950"
              }`}
            >
              <CheckCircle2 size={17} />
              {isCompleted ? "Finalizado" : "En progreso"}
            </span>
          </div>
        </div>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Training Session
          </p>

          <div className="mt-3 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                {athleteName}
              </h1>

              <p className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-400 md:text-base">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={17} className="text-cyan-300" />
                  {training.training_date}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin size={17} className="text-cyan-300" />
                  {training.location || "Sin ubicacion"}
                </span>
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="tal-chip">
                  {training.session_type || "Entrenamiento"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
                  {training.athlete_profiles?.category || "Sin categoria"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
                  {training.athlete_profiles?.bow_type || "Arco"}
                </span>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Score total</p>
              <p className="text-5xl font-black">{totalScore}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <MetricCard
            icon={BarChart3}
            title="Series"
            value={`${totalSeries}${plannedSeries ? `/${plannedSeries}` : ""}`}
          />
          <MetricCard
            icon={Crosshair}
            title="Flechas"
            value={`${totalArrows}${plannedArrows ? `/${plannedArrows}` : ""}`}
          />
          <MetricCard icon={Gauge} title="Promedio" value={averageArrow} />
          <MetricCard icon={Trophy} title="X / Miss" value={`${xCount}/${missCount}`} />
        </section>

        <section className="tal-chart-card">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Configuracion
            </p>
            <h2 className="mt-2 text-3xl font-black tal-text-glow">
              Parametros de sesion
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <SessionParam icon={Ruler} value={`${valueOrDash(currentRound?.distance_meters)} m`} title="Distancia" />
            <SessionParam icon={Target} value={`${valueOrDash(currentRound?.target_size_cm)} cm`} title="Tamano diana" />
            <SessionParam icon={BarChart3} value={valueOrDash(plannedSeries)} title="Series planeadas" />
            <SessionParam icon={Crosshair} value={valueOrDash(arrowsPerSeries)} title="Flechas por serie" />
            <SessionParam icon={Gauge} value={`${valueOrDash(training.brace_height_cm)} cm`} title="Brace height" />
            <SessionParam icon={BowArrow} value={training.equipment_profiles?.name || "Sin equipo"} title="Equipo" wide />
            <SessionParam icon={CloudSun} value={valueOrDash(training.weather)} title="Clima" />
            <SessionParam icon={Wind} value={`${valueOrDash(training.wind_speed_kmh || 0)} km/h`} title="Viento" />
            <SessionParam icon={Thermometer} value={`${valueOrDash(training.temperature_c || 0)} C`} title="Temperatura" />
            <SessionParam icon={Activity} value={training.status || "draft"} title="Estado" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <InfoPanel
            icon={Target}
            title="Objetivo"
            value={training.objective || "Sin objetivo registrado."}
          />
          <InfoPanel
            icon={NotebookText}
            title="Notas del entrenador"
            value={training.coach_notes || "Sin notas registradas."}
          />
          <InfoPanel
            icon={NotebookText}
            title="Notas del atleta"
            value={training.athlete_notes || "Sin notas registradas."}
          />
        </section>

        <section className="tal-chart-card">
          <div className="mb-5 border-b border-white/10 pb-5">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Round Workflow
            </p>
            <h3 className="mt-2 text-3xl font-black tal-text-glow">
              Rondas del entrenamiento
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Cada ronda se finaliza por separado. Si la ronda no registra
              puntos, solo solicita retroalimentacion.
            </p>
          </div>

          <div className="space-y-5">
            {trainingRounds.map((round: any) => {
              const completedSeries = round.series?.length || 0;
              const plannedRoundSeries = Number(round.total_series || 0);
              const roundCompleted = round.status === "completed";
              const scoringEnabled = round.scoring_enabled !== false;

              return (
                <div
                  key={round.id}
                  className="overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-slate-950/70"
                >
                  <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                        Ronda #{round.round_number || 1}
                      </p>
                      <h4 className="mt-1 text-xl font-black text-white">
                        {round.distance_meters} m / Diana {round.target_size_cm || "-"} cm
                      </h4>
                      <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">
                        {round.objective || "Sin objetivo específico para esta ronda."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                        {round.session_type || training.session_type || "Entrenamiento"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-300">
                        {completedSeries}/{plannedRoundSeries || "-"} series
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-300">
                        {round.arrows_per_series || 6} flechas
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          scoringEnabled
                            ? "bg-cyan-400/15 text-cyan-200"
                            : "bg-violet-400/15 text-violet-200"
                        }`}
                      >
                        {scoringEnabled ? "Con puntos" : "Solo feedback"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          roundCompleted
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-yellow-300 text-slate-950"
                        }`}
                      >
                        {roundCompleted ? "Finalizada" : "Activa"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {roundCompleted ? (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                          Retroalimentacion
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {round.feedback || "Ronda finalizada sin retroalimentacion visible."}
                        </p>
                      </div>
                    ) : scoringEnabled ? (
                      <>
                        <TrainingSeriesCapture
                          trainingId={training.id}
                          roundId={round.id}
                          distanceMeters={round.distance_meters || 0}
                          targetSizeCm={round.target_size_cm || 0}
                          arrowsPerSeries={round.arrows_per_series || 6}
                        />
                        <TrainingRoundFinalizeForm
                          roundId={round.id}
                          scoringEnabled
                          completedSeries={completedSeries}
                          plannedSeries={plannedRoundSeries}
                        />
                      </>
                    ) : (
                      <TrainingRoundFinalizeForm
                        roundId={round.id}
                        scoringEnabled={false}
                        completedSeries={completedSeries}
                        plannedSeries={plannedRoundSeries}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {routineBlocks.length > 0 && (
          <section className="tal-chart-card">
            <div className="mb-5 border-b border-white/10 pb-5">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">
                TAL Conditioning Blocks
              </p>
              <h3 className="mt-2 text-3xl font-black tal-text-glow">
                Rutinas del entrenamiento
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Bloques de fuerza o SPT programados como parte de esta sesion.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {routineBlocks.map((routine: any) => {
                const isSpt = routine.routine_type === "spt";

                return (
                  <div
                    key={routine.id}
                    className="rounded-[1.8rem] border border-emerald-300/15 bg-emerald-400/[0.045] p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                          Rutina #{routine.routine_number || 1}
                        </p>
                        <h4 className="mt-2 text-xl font-black text-white">
                          {routine.title ||
                            (isSpt ? "Rutina SPT" : "Rutina de fuerza")}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {routine.objective || "Sin objetivo especifico."}
                        </p>
                      </div>

                      <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-200">
                        {isSpt ? "SPT" : "Fuerza"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-white md:grid-cols-4">
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        {routine.focus_area || "Enfoque"}
                      </span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        {routine.intensity || "Intensidad"}
                      </span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        {routine.duration_minutes
                          ? `${routine.duration_minutes} min`
                          : "Sin tiempo"}
                      </span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        {isSpt
                          ? routine.spt_volume || "Volumen SPT"
                          : `${routine.sets || "-"} x ${routine.reps || "-"}`}
                      </span>
                    </div>

                    <p className="mt-4 text-sm font-bold leading-6 text-slate-300">
                      {isSpt
                        ? routine.spt_drill || "Drill SPT sin detalle."
                        : routine.exercises || "Ejercicios sin detalle."}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      {routine.technical_cue || routine.tempo || "Sin cue tecnico."}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="tal-chart-card">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Official Score Register
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-tight tal-text-glow">
                Series registradas
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Registro por serie en formato de acta: flechas, total, promedio
                y agrupacion.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-center shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                Rondas
              </p>
              <p className="text-4xl font-black text-white">
                {trainingRounds.length || 0}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {trainingRounds.map((round: any) => {
              const roundArrowNumbers = Array.from(
                { length: Math.max(1, Number(round.arrows_per_series || 6)) },
                (_, index) => index
              );

              return (
              <div key={round.id} className="overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-slate-950/70">
                <div className="flex flex-col gap-4 border-b border-white/10 bg-cyan-400/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      Ronda #{round.round_number || 1}
                    </p>
                    <h4 className="mt-1 text-xl font-black text-white">
                      {round.distance_meters} m / Diana {round.target_size_cm || "-"} cm
                    </h4>
                    <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">
                      {round.objective || "Sin objetivo específico."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-black text-slate-300">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                      {round.session_type || training.session_type || "Entrenamiento"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                      {round.series?.length || 0}/{round.total_series || "-"} series
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                      {round.arrows_per_series || 6} flechas/serie
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.035] text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        <th className="px-4 py-4 text-left">Serie</th>
                        {roundArrowNumbers.map((index) => (
                          <th key={index} className="px-3 py-4 text-center">
                            F{index + 1}
                          </th>
                        ))}
                        <th className="px-4 py-4 text-center">X</th>
                        <th className="px-4 py-4 text-center">M</th>
                        <th className="px-4 py-4 text-center">Total</th>
                        <th className="px-4 py-4 text-center">Prom.</th>
                        <th className="px-4 py-4 text-center">Grupo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {round.series?.map((serie: any) => {
                        const arrows = [...(serie.arrows || [])].sort(
                          (a: any, b: any) => Number(a.arrow_number) - Number(b.arrow_number)
                        );
                        const xInSeries = arrows.filter((arrow: any) => arrow.is_x).length;
                        const missInSeries = arrows.filter((arrow: any) => Number(arrow.score || 0) === 0).length;
                        const groupSizeCm =
                          serie.group_size_cm ??
                          calculateGroupSizeCm(
                            arrows,
                            Number(round.target_size_cm || 0)
                          );

                        return (
                          <tr key={serie.id} className="border-b border-white/10 transition hover:bg-cyan-400/5">
                            <td className="px-4 py-4">
                              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 font-black text-cyan-300">
                                {serie.series_number}
                              </span>
                            </td>

                            {roundArrowNumbers.map((index) => {
                              const display = arrowDisplay(arrows[index]);
                              const isX = display === "X";
                              const isMiss = display === "M";

                              return (
                                <td key={index} className="px-3 py-4 text-center">
                                  <span
                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-base font-black ${
                                      isX
                                        ? "border-yellow-300/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.20)]"
                                        : isMiss
                                        ? "border-red-400/30 bg-red-500/10 text-red-300"
                                        : "border-white/10 bg-white/[0.04] text-white"
                                    }`}
                                  >
                                    {display || "-"}
                                  </span>
                                </td>
                              );
                            })}

                            <td className="px-4 py-4 text-center font-black text-yellow-300">
                              {xInSeries}
                            </td>
                            <td className="px-4 py-4 text-center font-black text-red-300">
                              {missInSeries}
                            </td>
                            <td className="px-4 py-4 text-center text-xl font-black text-cyan-300">
                              {serie.total_score || 0}
                            </td>
                            <td className="px-4 py-4 text-center font-black text-white">
                              {Number(serie.average_score || 0).toFixed(1)}
                            </td>
                            <td className="px-4 py-4 text-center font-black text-white">
                              {groupSizeCm ? `${groupSizeCm} cm` : "-"}
                            </td>
                          </tr>
                        );
                      })}

                      {(!round.series || round.series.length === 0) && (
                        <tr>
                          <td colSpan={roundArrowNumbers.length + 6} className="px-4 py-8 text-center text-slate-500">
                            Aun no hay series registradas para esta ronda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })}

            {trainingRounds.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="text-lg font-bold text-slate-400">
                  Aun no hay series registradas.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="tal-chart-card">
          <TargetHeatmap arrows={allTrainingArrows} />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
}) {
  return (
    <div className="tal-metric-card">
      <span className="tal-metric-icon">
        <Icon size={20} />
      </span>
      <p className="tal-metric-label">{title}</p>
      <p className="tal-metric-value">{value}</p>
    </div>
  );
}

function SessionParam({
  icon: Icon,
  value,
  title,
  wide = false,
}: {
  icon: LucideIcon;
  value: string;
  title: string;
  wide?: boolean;
}) {
  return (
    <div
      title={title}
      className={`flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <Icon className="shrink-0 text-cyan-300" size={18} />
      <span className="truncate text-sm font-black text-white">{value}</span>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="tal-chart-card">
      <h3 className="mb-3 flex items-center gap-3 text-xl font-black text-white">
        <span className="tal-metric-icon mb-0">
          <Icon size={20} />
        </span>
        {title}
      </h3>
      <p className="text-sm leading-6 text-slate-400">{value}</p>
    </div>
  );
}
