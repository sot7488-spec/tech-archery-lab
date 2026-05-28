export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Trophy,
  Target,
  Plus,
  ArrowRight,
  Calendar,
  Crosshair,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createConadeMark } from "./actions";

export default async function ConadePage() {
  const { data: marks, error } = await supabase
    .from("conade_marks")
    .select("*")
    .order("year", { ascending: false })
    .order("category", { ascending: true });

  const totalMarks = marks?.length || 0;

  const inputClass =
    "rounded-2xl border border-cyan-400/10 bg-slate-950/80 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

  const statCardClass =
    "relative overflow-hidden rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_40px_rgba(0,0,0,0.25)] backdrop-blur-xl";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            ← Dashboard
          </Link>
        </div>

        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <div className="relative">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL CONADE Performance
            </p>

            <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Olimpiada Nacional
                  <span className="block text-cyan-300">CONADE</span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                  Registro de marcas mínimas por categoría, rama, modalidad,
                  distancia y flechas.
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
                <p className="text-xs font-black uppercase">Marcas</p>
                <p className="text-5xl font-black">{totalMarks}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={statCardClass}>
            <Calendar className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Registros
            </p>
            <p className="mt-2 text-4xl font-black">{totalMarks}</p>
          </div>

          <div className={statCardClass}>
            <Target className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Recurvo
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {marks?.filter((m: any) => m.bow_type === "recurvo").length || 0}
            </p>
          </div>

          <div className={statCardClass}>
            <Crosshair className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Compuesto
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {marks?.filter((m: any) => m.bow_type === "compuesto").length || 0}
            </p>
          </div>

          <div className={statCardClass}>
            <Trophy className="mb-3 text-yellow-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Mayor marca
            </p>
            <p className="mt-2 text-4xl font-black text-yellow-300">
              {marks?.length
                ? Math.max(...marks.map((m: any) => Number(m.minimum_score || 0)))
                : 0}
            </p>
          </div>
        </section>

        <form
          action={createConadeMark}
          className="mb-8 rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Plus size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-black">Nueva marca mínima</h2>
              <p className="text-sm text-slate-400">
                Captura los criterios oficiales o internos para comparar atletas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input name="year" type="number" placeholder="Año" className={inputClass} required />

            <select name="category" className={inputClass} required>
              <option value="">Categoría</option>
              <option value="Sub 14">Sub 14</option>
              <option value="Sub 16">Sub 16</option>
              <option value="Sub 18">Sub 18</option>
              <option value="Sub 21">Sub 21</option>
              <option value="Sub 24">Sub 24</option>
            </select>

            <select name="gender" className={inputClass} required>
              <option value="">Rama</option>
              <option value="femenil">Femenil</option>
              <option value="varonil">Varonil</option>
            </select>

            <select name="bow_type" className={inputClass} required>
              <option value="">Modalidad</option>
              <option value="recurvo">Recurvo</option>
              <option value="compuesto">Compuesto</option>
            </select>

            <input name="distance_meters" type="number" placeholder="Distancia m" className={inputClass} required />
            <input name="target_size_cm" type="number" placeholder="Diana cm" className={inputClass} />
            <input name="arrows_count" type="number" placeholder="Flechas" defaultValue={72} className={inputClass} />
            <input name="minimum_score" type="number" placeholder="Marca mínima" className={inputClass} required />

            <input name="notes" placeholder="Notas" className={`${inputClass} md:col-span-3`} />

            <button className="rounded-2xl bg-cyan-400 p-4 font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300">
              Guardar marca
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                CONADE Marks Registry
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Marcas registradas
              </h2>

              <p className="text-sm text-slate-400">
                Haz clic en una marca para ver atletas clasificados por categoría,
                modalidad, año y score mínimo.
              </p>
            </div>

            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
              {totalMarks} marcas
            </div>
          </div>

          <div className="space-y-4">
            {marks?.map((mark: any) => {
              const classifiedHref = `/conade/clasificados?mark_id=${mark.id}`;

              return (
                <Link
                  key={mark.id}
                  href={classifiedHref}
                  className="group relative block overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-4 shadow-[0_0_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/[0.06] hover:shadow-[0_0_70px_rgba(34,211,238,0.12)]"
                >
                  <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition group-hover:bg-cyan-300/20" />

                  <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                          {mark.bow_type}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {mark.gender}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-white">
                        {mark.category}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Año {mark.year} · {mark.distance_meters} m · Diana{" "}
                        {mark.target_size_cm || "-"} cm
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-xs font-bold text-slate-500">
                          Flechas
                        </p>
                        <p className="mt-1 font-black text-white">
                          {mark.arrows_count}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-xs font-bold text-slate-500">
                          Distancia
                        </p>
                        <p className="mt-1 font-black text-white">
                          {mark.distance_meters} m
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-yellow-300/20 bg-yellow-300/10 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">
                        Marca mínima
                      </p>
                      <p className="mt-1 text-4xl font-black text-yellow-300">
                        {mark.minimum_score}
                      </p>
                    </div>

                    <div className="flex items-center justify-end">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition group-hover:translate-x-1 group-hover:bg-cyan-300">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>

                  {mark.notes && (
                    <p className="relative mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-400">
                      {mark.notes}
                    </p>
                  )}
                </Link>
              );
            })}

            {marks?.length === 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
                Aún no hay marcas registradas.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}