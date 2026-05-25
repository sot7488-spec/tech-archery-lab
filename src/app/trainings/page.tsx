export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { createTraining } from "./actions";

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete_id?: string }>;
}) {
  const params = await searchParams;
  const selectedAthleteId = params.athlete_id || "";

  const { data: athletes } = await supabase.from("athlete_profiles").select(`
    id,
    users!athlete_profiles_user_id_fkey (
      name
    )
  `);

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
    "rounded-2xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
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

        <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-8 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
            Dashboard de entrenamiento
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Entrenamientos
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                {selectedAthlete
                  ? `Análisis de sesiones de ${
                      (selectedAthlete.users as any)?.name || "atleta"
                    }`
                  : "Control estadístico de sesiones, objetivos, clima, score y evolución deportiva."}
              </p>
            </div>

            <div className="rounded-3xl bg-cyan-400 px-6 py-4 text-slate-950 shadow-xl shadow-cyan-500/20">
              <p className="text-xs font-black uppercase">Sesiones</p>
              <p className="text-4xl font-black">{totalTrainings}</p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Entrenamientos</p>
            <p className="mt-2 text-4xl font-black">{totalTrainings}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Score acumulado</p>
            <p className="mt-2 text-4xl font-black">{totalScore}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Promedio</p>
            <p className="mt-2 text-4xl font-black">{averageScore}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Competencias</p>
            <p className="mt-2 text-4xl font-black">{competitionSessions}</p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
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
          className="mb-8 grid grid-cols-1 gap-4 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:grid-cols-3"
        >
          <div className="md:col-span-3">
            <h2 className="text-2xl font-black">Registrar entrenamiento</h2>
            <p className="text-sm font-medium text-slate-500">
              Captura los datos principales de la sesión.
            </p>
          </div>

          <select
            name="athlete_id"
            className={inputClass}
            required
            defaultValue={selectedAthleteId}
          >
            <option value="" disabled>
              Selecciona atleta
            </option>

            {athletes?.map((athlete: any) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.users?.name}
              </option>
            ))}
          </select>

          <input
            name="training_date"
            type="date"
            className={inputClass}
            required
          />

          <input
            name="location"
            placeholder="Lugar"
            className={inputClass}
          />

          <select
            name="session_type"
            className={inputClass}
            defaultValue="técnico"
          >
            <option value="técnico">Técnico</option>
            <option value="puntuación">Puntuación</option>
            <option value="competencia">Competencia</option>
            <option value="tuning">Tuning</option>
            <option value="físico">Físico</option>
          </select>

          <select
            name="weather"
            className={inputClass}
            defaultValue="soleado"
          >
            <option value="soleado">Soleado</option>
            <option value="nublado">Nublado</option>
            <option value="lluvia">Lluvia</option>
            <option value="viento">Viento</option>
            <option value="interior">Interior</option>
            <option value="otro">Otro</option>
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
            className={`${inputClass} md:col-span-3`}
            rows={3}
          />

          <button className="rounded-2xl bg-slate-950 p-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-400 hover:text-slate-950">
            Crear entrenamiento
          </button>
        </form>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-100 p-4 text-red-700">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trainings?.map((training: any) => (
            <Link
              key={training.id}
              href={`/trainings/${training.id}`}
              className="group rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black">
                    {training.athlete_profiles?.users?.name}
                  </h2>
                  <p className="text-sm font-bold text-slate-500">
                    {training.training_date}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase text-cyan-700">
                  {training.status || "draft"}
                </span>
              </div>

              <div className="mb-5 rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-sm font-bold text-slate-400">Score total</p>
                <p className="text-5xl font-black">
                  {training.total_score || 0}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-slate-500">Tipo</p>
                  <p className="font-black">
                    {training.session_type || "Entrenamiento"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-slate-500">Lugar</p>
                  <p className="font-black">{training.location || "-"}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-slate-500">Clima</p>
                  <p className="font-black">{training.weather || "-"}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-slate-500">Viento</p>
                  <p className="font-black">
                    {training.wind_speed_kmh || 0} km/h
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm font-black text-cyan-600 transition group-hover:translate-x-1">
                Ver detalle →
              </p>
            </Link>
          ))}

          {trainings?.length === 0 && (
            <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-xl">
              No hay entrenamientos para este atleta.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}