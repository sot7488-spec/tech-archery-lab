export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createTraining } from "./actions";

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete_id?: string }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;
  const selectedAthleteId = params.athlete_id || "";

  const { data: athletes } = await supabase.from("athlete_profiles").select(`
    id,
    users!athlete_profiles_user_id_fkey (
      name
    )
  `);

  const { data: equipmentProfiles } = await supabase
    .from("equipment_profiles")
    .select("id, name, athlete_id, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  let query = supabase
    .from("training_sessions")
    .select(`
      *,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `)
    .order("training_date", { ascending: false });

  if (selectedAthleteId) {
    query = query.eq("athlete_id", selectedAthleteId);
  }

  const { data: trainings, error } = await query;

  const selectedAthlete = athletes?.find(
    (athlete: any) => athlete.id === selectedAthleteId
  );

  const totalTrainings = trainings?.length || 0;

  const totalScore =
    trainings?.reduce(
      (sum: number, training: any) => sum + Number(training.total_score || 0),
      0
    ) || 0;

  const averageScore =
    totalTrainings > 0 ? Math.round(totalScore / totalTrainings) : 0;

  const competitionSessions =
    trainings?.filter((training: any) => training.session_type === "competencia")
      .length || 0;

  const inputClass =
    "h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white outline-none backdrop-blur-xl transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:bg-cyan-400/[0.05] focus:ring-4 focus:ring-cyan-400/10";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 tal-grid-bg opacity-30" />
      <div className="absolute right-[-200px] top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-120px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300 hover:bg-cyan-400 hover:text-slate-950"
          >
            ← Dashboard
          </Link>

          <Link
            href="/athletes"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            Ver atletas
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/30 p-10 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <p className="relative z-10 text-xs font-black uppercase tracking-[0.4em] text-cyan-300">
            TAL Training Lab
          </p>

          <div className="relative z-10 mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-6xl font-black tracking-tight">
                Entrenamientos
                <span className="block text-cyan-300 tal-text-glow">
                  Performance Data
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-slate-400">
                {selectedAthlete
                  ? `Análisis de sesiones de ${
                      (selectedAthlete.users as any)?.name || "atleta"
                    }`
                  : "Control estadístico de sesiones, objetivos, clima, score, equipamiento, distancia, diana y brace height."}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-6 py-4 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
              <p className="text-xs font-black uppercase text-cyan-300">
                Sesiones
              </p>
              <p className="text-5xl font-black text-white">{totalTrainings}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {[
            ["Entrenamientos", totalTrainings],
            ["Score acumulado", totalScore],
            ["Promedio", averageScore],
            ["Competencias", competitionSessions],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
            >
              <p className="text-sm font-bold text-slate-400">{label}</p>
              <p className="mt-2 text-4xl font-black text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-2xl">
          <h2 className="mb-4 text-xl font-black">Filtrar por atleta</h2>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trainings"
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                !selectedAthleteId
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              Todos
            </Link>

            {athletes?.map((athlete: any) => (
              <Link
                key={athlete.id}
                href={`/trainings?athlete_id=${athlete.id}`}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  selectedAthleteId === athlete.id
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {athlete.users?.name}
              </Link>
            ))}
          </div>
        </section>

        <form
          action={createTraining}
          className="grid grid-cols-1 gap-5 rounded-[2.5rem] border border-cyan-400/10 bg-white/[0.03] p-8 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:grid-cols-3"
        >
          <div className="md:col-span-3">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Nueva sesión
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Registrar entrenamiento
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Define atleta, equipamiento, distancia, tamaño de diana y número
              de series para iniciar el registro de flechas.
            </p>
          </div>

          <select
            name="athlete_id"
            className={inputClass}
            required
            defaultValue={selectedAthleteId || ""}
          >
            <option className="bg-slate-900 text-white" value="" disabled>
              Selecciona atleta
            </option>

            {athletes?.map((athlete: any) => (
              <option
                className="bg-slate-900 text-white"
                key={athlete.id}
                value={athlete.id}
              >
                {athlete.users?.name}
              </option>
            ))}
          </select>

          <select
            name="equipment_profile_id"
            className={inputClass}
            defaultValue=""
          >
            <option className="bg-slate-900 text-white" value="">
              Equipamiento utilizado
            </option>

            {equipmentProfiles?.map((equipment: any) => (
              <option
                className="bg-slate-900 text-white"
                key={equipment.id}
                value={equipment.id}
              >
                {equipment.name}
              </option>
            ))}
          </select>

          <input
            name="brace_height_cm"
            type="number"
            step="0.1"
            placeholder="Brace height cm"
            className={inputClass}
          />

          <input
            name="distance_meters"
            type="number"
            placeholder="Distancia m"
            className={inputClass}
            required
          />

          <input
            name="target_size_cm"
            type="number"
            placeholder="Tamaño de diana cm"
            className={inputClass}
            required
          />

          <input
            name="total_series"
            type="number"
            placeholder="Número de series"
            className={inputClass}
            min={1}
            required
          />

          <input
            name="training_date"
            type="date"
            className={inputClass}
            required
          />

          <input name="location" placeholder="Lugar" className={inputClass} />

          <select
            name="session_type"
            className={inputClass}
            defaultValue="técnico"
          >
            <option className="bg-slate-900 text-white" value="técnico">
              Técnico
            </option>
            <option className="bg-slate-900 text-white" value="puntuación">
              Puntuación
            </option>
            <option className="bg-slate-900 text-white" value="competencia">
              Competencia
            </option>
            <option className="bg-slate-900 text-white" value="tuning">
              Tuning
            </option>
            <option className="bg-slate-900 text-white" value="físico">
              Físico
            </option>
          </select>

          <select name="weather" className={inputClass} defaultValue="soleado">
            <option className="bg-slate-900 text-white" value="soleado">
              Soleado
            </option>
            <option className="bg-slate-900 text-white" value="nublado">
              Nublado
            </option>
            <option className="bg-slate-900 text-white" value="lluvia">
              Lluvia
            </option>
            <option className="bg-slate-900 text-white" value="viento">
              Viento
            </option>
            <option className="bg-slate-900 text-white" value="interior">
              Interior
            </option>
            <option className="bg-slate-900 text-white" value="otro">
              Otro
            </option>
          </select>

          <input
            name="wind_speed_kmh"
            type="number"
            placeholder="Viento km/h"
            className={inputClass}
          />

          <input
            name="temperature_c"
            type="number"
            placeholder="Temperatura °C"
            className={inputClass}
          />

          <input
            name="objective"
            placeholder="Objetivo del entrenamiento"
            className={`${inputClass} md:col-span-2`}
          />

          <textarea
            name="coach_notes"
            placeholder="Notas del entrenador"
            className={`${inputClass} h-28 py-4 md:col-span-3`}
            rows={3}
          />

          <button className="group relative overflow-hidden rounded-2xl bg-cyan-400 px-5 py-5 font-black text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition-all hover:-translate-y-1 hover:bg-cyan-300 md:col-span-3">
            <span className="relative z-10">Crear entrenamiento</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-cyan-100 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </form>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trainings?.map((training: any) => (
            <Link
              key={training.id}
              href={`/trainings/${training.id}`}
              className="group relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_0_60px_rgba(34,211,238,0.12)]"
            >
              <div className="absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-cyan-400/5 blur-3xl transition-all group-hover:bg-cyan-400/10" />

              <div className="relative z-10 mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">
                    {training.athlete_profiles?.users?.name}
                  </h2>

                  <p className="text-sm font-bold text-slate-400">
                    {training.training_date}
                  </p>
                </div>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-300">
                  {training.status || "draft"}
                </span>
              </div>

              <div className="relative z-10 mb-5 rounded-3xl bg-slate-950/80 p-5 text-white">
                <p className="text-sm font-bold text-slate-400">Score total</p>
                <p className="text-5xl font-black text-cyan-300">
                  {training.total_score || 0}
                </p>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Tipo</p>
                  <p className="font-black text-white">
                    {training.session_type || "Entrenamiento"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Brace</p>
                  <p className="font-black text-white">
                    {training.brace_height_cm || 0} cm
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Lugar</p>
                  <p className="font-black text-white">
                    {training.location || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <p className="text-slate-500">Viento</p>
                  <p className="font-black text-white">
                    {training.wind_speed_kmh || 0} km/h
                  </p>
                </div>
              </div>

              <p className="relative z-10 mt-5 text-sm font-black text-cyan-300 transition group-hover:translate-x-1">
                Ver detalle →
              </p>
            </Link>
          ))}

          {trainings?.length === 0 && (
            <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 text-slate-400">
              No hay entrenamientos registrados.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}