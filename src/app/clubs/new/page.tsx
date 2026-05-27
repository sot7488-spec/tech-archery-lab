import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { createClub } from "./actions";

export const dynamic = "force-dynamic";

export default function NewClubPage() {
  return (
    <main className="min-h-screen tal-radial tal-grid-bg px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/clubs"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/20"
        >
          <ArrowLeft size={16} />
          Regresar a clubs
        </Link>

        <section className="tal-panel tal-glow p-8">
          <div className="mb-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Building2 size={30} />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Network
            </p>

            <h1 className="mt-3 text-4xl font-black text-white">
              Crear nuevo club
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Registra un club para asociar atletas, coaches y entrenamientos.
            </p>
          </div>

          <form action={createClub} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Nombre del club
              </label>
              <input
                name="name"
                required
                placeholder="Ej. Tech Archery Lab"
                className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Ciudad
                </label>
                <input
                  name="city"
                  placeholder="Celaya"
                  className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Estado
                </label>
                <input
                  name="state"
                  placeholder="Guanajuato"
                  className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                País
              </label>
              <input
                name="country"
                defaultValue="México"
                className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                URL del logo
              </label>
              <input
                name="logo_url"
                placeholder="https://..."
                className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/clubs"
                className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-300"
              >
                <Save size={16} />
                Guardar club
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}