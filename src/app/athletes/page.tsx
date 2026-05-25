export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { createAthlete } from "./actions";

export default async function AthletesPage() {
  const { data: athletes, error } = await supabase
    .from("athlete_profiles")
    .select(`
      *,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      )
    `);

  const totalAthletes = athletes?.length || 0;

  const recurveCount =
    athletes?.filter((athlete: any) => athlete.bow_type === "recurvo").length ||
    0;

  const compoundCount =
    athletes?.filter((athlete: any) => athlete.bow_type === "compuesto")
      .length || 0;

  const avgPounds =
    athletes && athletes.length > 0
      ? Math.round(
          athletes.reduce(
            (sum: number, athlete: any) =>
              sum + Number(athlete.draw_weight_lbs || 0),
            0
          ) / athletes.length
        )
      : 0;

  const inputClass =
    "rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-medium text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10";

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
        </div>

        <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-8 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
            Gestión deportiva
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Atletas
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Control de arqueros, categoría, tipo de arco, mano dominante y
                potencia de entrenamiento.
              </p>
            </div>

            <div className="rounded-3xl bg-cyan-400 px-6 py-4 text-slate-950 shadow-xl shadow-cyan-500/20">
              <p className="text-xs font-black uppercase">Registrados</p>
              <p className="text-5xl font-black">{totalAthletes}</p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Total atletas</p>
            <p className="mt-2 text-4xl font-black">{totalAthletes}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Recurvo</p>
            <p className="mt-2 text-4xl font-black">{recurveCount}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Compuesto</p>
            <p className="mt-2 text-4xl font-black">{compoundCount}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Prom. libras</p>
            <p className="mt-2 text-4xl font-black">{avgPounds}</p>
          </div>
        </section>

        <form
          action={createAthlete}
          className="mb-8 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur"
        >
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Nuevo atleta</h2>
              <p className="text-sm font-medium text-slate-400">
                Registra los datos principales del arquero.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
  <label className="mb-2 block text-sm font-bold text-slate-300">
    Foto del atleta
  </label>

  <input
    name="photo"
    type="file"
    accept="image/*"
    capture="environment"
    className="w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-black file:text-slate-950"
  />
</div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              name="name"
              placeholder="Nombre del atleta"
              className={inputClass}
              required
            />

            <input
              name="email"
              placeholder="Correo"
              className={inputClass}
              required
            />

            <input
              name="category"
              placeholder="Categoría"
              className={inputClass}
            />

            <select
              name="bow_type"
              defaultValue="recurvo"
              className={inputClass}
            >
              <option value="recurvo">Recurvo</option>
              <option value="compuesto">Compuesto</option>
              <option value="barebow">Barebow</option>
              <option value="tradicional">Tradicional</option>
            </select>

            <select
              name="dominant_hand"
              defaultValue="diestro"
              className={inputClass}
            >
              <option value="diestro">Diestro</option>
              <option value="zurdo">Zurdo</option>
            </select>

            <input
              name="draw_weight_lbs"
              type="number"
              placeholder="Libras"
              className={inputClass}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button className="rounded-2xl bg-cyan-400 px-8 py-4 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300">
              Guardar atleta
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-100 p-4 text-red-700">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {athletes?.map((athlete: any) => (
            <Link
              href={`/athletes/${athlete.id}`}
              key={athlete.id}
              className="group rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    {athlete.users?.name}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {athlete.users?.email}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase text-cyan-700">
                  {athlete.bow_type || "arco"}
                </span>
              </div>

              <div className="mb-5 rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-sm font-bold text-slate-400">Potencia</p>
                <p className="mt-1 text-5xl font-black">
                  {athlete.draw_weight_lbs || "-"}
                  <span className="ml-1 text-lg text-slate-400">lbs</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-slate-500">Categoría</p>
                  <p className="font-black">{athlete.category || "-"}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-slate-500">Dominante</p>
                  <p className="font-black">{athlete.dominant_hand || "-"}</p>
                </div>
              </div>

              <p className="mt-5 text-sm font-black text-cyan-600 transition group-hover:translate-x-1">
                Ver perfil →
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}