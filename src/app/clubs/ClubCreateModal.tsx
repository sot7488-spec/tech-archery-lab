"use client";

import { useState } from "react";
import { Plus, X, Save, Building2 } from "lucide-react";
import { createClub } from "./actions";

export default function ClubCreateModal() {
  const [open, setOpen] = useState(false);

  async function handleCreateClub(formData: FormData) {
    await createClub(formData);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-200 shadow-lg shadow-cyan-500/10 hover:bg-cyan-400/20"
      >
        <Plus size={16} />
        Nuevo club
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl">
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-cyan-400/20 bg-slate-950 p-6 text-white shadow-[0_0_80px_rgba(34,211,238,0.18)]">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-white/20"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Building2 size={26} />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Network
              </p>

              <h2 className="mt-2 text-3xl font-black">Crear club</h2>
            </div>

            <form action={handleCreateClub} className="space-y-5">
              <input
                name="name"
                required
                placeholder="Nombre del club"
                className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="city"
                  placeholder="Ciudad"
                  className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
                />

                <input
                  name="state"
                  placeholder="Estado"
                  className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
                />
              </div>

              <input
                name="country"
                defaultValue="México"
                placeholder="País"
                className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />

              <input
                name="logo_url"
                placeholder="URL del logo"
                className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black hover:bg-white/20"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300"
                >
                  <Save size={16} />
                  Guardar club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
