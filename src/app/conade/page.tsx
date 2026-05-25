export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { createConadeMark } from "./actions";

export default async function ConadePage() {
  const { data: marks, error } = await supabase
    .from("conade_marks")
    .select("*")
    .order("year", { ascending: false })
    .order("category", { ascending: true });

  return (
    <main className="min-h-screen p-8 text-white">
      <Link href="/" className="text-cyan-300 hover:text-cyan-200">
        ← Dashboard
      </Link>

      <section className="mb-8 mt-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-8 shadow-2xl backdrop-blur">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
          CONADE Marks
        </p>

        <h1 className="text-5xl font-black tracking-tight text-white">
          Olimpiada Nacional CONADE
        </h1>

        <p className="mt-3 max-w-3xl text-slate-300">
          Registro de marcas mínimas por categoría, rama, modalidad y distancia.
        </p>
      </section>

      <form
        action={createConadeMark}
        className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
      >
        <div className="mb-5">
          <h2 className="text-2xl font-black text-white">
            Nueva marca mínima
          </h2>

          <p className="text-sm text-slate-400">
            Captura los criterios oficiales o internos para comparar atletas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            name="year"
            type="number"
            placeholder="Año"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            required
          />

          <select
            name="category"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white focus:border-cyan-400 focus:outline-none"
            required
          >
            <option value="">Categoría</option>
            <option value="Sub 14">Sub 14</option>
            <option value="Sub 16">Sub 16</option>
            <option value="Sub 18">Sub 18</option>
            <option value="Sub 21">Sub 21</option>
            <option value="Sub 24">Sub 24</option>
          </select>

          <select
            name="gender"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white focus:border-cyan-400 focus:outline-none"
            required
          >
            <option value="">Rama</option>
            <option value="femenil">Femenil</option>
            <option value="varonil">Varonil</option>
          </select>

          <select
            name="bow_type"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white focus:border-cyan-400 focus:outline-none"
            required
          >
            <option value="">Modalidad</option>
            <option value="recurvo">Recurvo</option>
            <option value="compuesto">Compuesto</option>
          </select>

          <input
            name="distance_meters"
            type="number"
            placeholder="Distancia m"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            required
          />

          <input
            name="target_size_cm"
            type="number"
            placeholder="Diana cm"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />

          <input
            name="arrows_count"
            type="number"
            placeholder="Flechas"
            defaultValue={72}
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />

          <input
            name="minimum_score"
            type="number"
            placeholder="Marca mínima"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            required
          />

          <input
            name="notes"
            placeholder="Notas"
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none md:col-span-3"
          />

          <button className="rounded-2xl bg-cyan-400 p-4 font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300">
            Guardar marca
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
          {JSON.stringify(error)}
        </div>
      )}

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">
              Marcas registradas
            </h2>

            <p className="text-sm text-slate-400">
              Catálogo de referencias para evaluación y clasificación.
            </p>
          </div>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
            {marks?.length || 0} marcas
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-slate-300">
              <tr className="text-left">
                <th className="p-4">Año</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Rama</th>
                <th className="p-4">Modalidad</th>
                <th className="p-4">Distancia</th>
                <th className="p-4">Flechas</th>
                <th className="p-4">Marca</th>
              </tr>
            </thead>

            <tbody>
              {marks?.map((mark: any) => (
                <tr
                  key={mark.id}
                  className="border-t border-white/10 transition hover:bg-white/10"
                >
                  <td className="p-4 font-bold text-white">{mark.year}</td>
                  <td className="p-4 text-slate-300">{mark.category}</td>
                  <td className="p-4 text-slate-300">{mark.gender}</td>
                  <td className="p-4">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                      {mark.bow_type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">
                    {mark.distance_meters} m
                  </td>
                  <td className="p-4 text-slate-300">
                    {mark.arrows_count}
                  </td>
                  <td className="p-4 text-xl font-black text-white">
                    {mark.minimum_score}
                  </td>
                </tr>
              ))}

              {marks?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-slate-400"
                  >
                    Aún no hay marcas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}