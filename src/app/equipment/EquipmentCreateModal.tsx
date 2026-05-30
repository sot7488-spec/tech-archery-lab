"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Save,
  Wrench,
  Target,
  BowArrow,
  Settings,
  Ruler,
  Crosshair,
} from "lucide-react";

import { createEquipment } from "./actions";

type Athlete = {
  id: string;
  users?: {
    name?: string | null;
  }[] | {
    name?: string | null;
  } | null;
};

type Props = {
  athletes: Athlete[];
};

const inputClass =
  "h-11 w-full rounded-xl border border-cyan-400/10 bg-white/[0.04] px-3 text-xs font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

const sectionClass =
  "rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-3 backdrop-blur-xl";

const sectionTitleClass =
  "mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300";

export default function EquipmentCreateModal({ athletes }: Props) {
  const [open, setOpen] = useState(false);

  function getAthleteName(athlete: Athlete) {
    if (Array.isArray(athlete.users)) {
      return athlete.users[0]?.name || "Atleta sin nombre";
    }

    return athlete.users?.name || "Atleta sin nombre";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-[1.4rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-slate-900 to-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/20 hover:shadow-[0_0_45px_rgba(34,211,238,0.28)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100" />

        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 transition duration-300 group-hover:bg-cyan-300 group-hover:text-slate-950">
          <Plus size={18} />
        </div>

        <div className="relative text-left">
          <p className="text-[10px] font-black tracking-[0.35em] text-cyan-300">
            TAL SETUP
          </p>
          <p className="mt-0.5 text-sm font-black text-white">Nuevo equipo</p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950 text-white shadow-[0_0_90px_rgba(34,211,238,0.20)]">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-80px] left-[-80px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Wrench size={22} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                    TAL Equipment Registry
                  </p>

                  <h2 className="mt-0.5 text-2xl font-black text-white">
                    Registrar equipamiento
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              action={createEquipment}
              className="
                relative z-10 flex-1 space-y-3 overflow-y-auto px-5 py-4 pr-3
                [scrollbar-width:thin]
                [scrollbar-color:rgba(34,211,238,0.65)_rgba(15,23,42,0.9)]
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-slate-900
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-cyan-400/60
                [&::-webkit-scrollbar-thumb:hover]:bg-cyan-300
              "
            >
              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Target size={14} />
                  Datos principales
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <select name="athlete_id" className={inputClass} required>
                    <option value="">Selecciona atleta</option>

                    {athletes?.map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {getAthleteName(athlete)}
                      </option>
                    ))}
                  </select>

                  <input
                    name="name"
                    placeholder="Nombre del equipo"
                    className={inputClass}
                  />

                  <select
                    name="bow_type"
                    className={inputClass}
                    defaultValue="recurvo"
                  >
                    <option value="recurvo">Recurvo</option>
                    <option value="compuesto">Compuesto</option>
                    <option value="tradicional">Tradicional</option>
                  </select>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <section className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <BowArrow size={14} />
                    Arco / Riser / Limbs
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <input name="bow_brand" placeholder="Marca arco" className={inputClass} />
                    <input name="bow_model" placeholder="Modelo arco" className={inputClass} />
                    <input name="bow_length_inches" type="number" placeholder="Largo arco" className={inputClass} />

                    <input name="riser_brand" placeholder="Marca riser" className={inputClass} />
                    <input name="riser_model" placeholder="Modelo riser" className={inputClass} />
                    <input name="riser_length_inches" type="number" placeholder="Riser pulgadas" className={inputClass} />

                    <input name="limb_brand" placeholder="Marca limbs" className={inputClass} />
                    <input name="limbs_model" placeholder="Modelo limbs" className={inputClass} />

                    <select name="limb_length" className={inputClass} defaultValue="">
                      <option value="">Tamaño limbs</option>
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                </section>

                <section className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <Ruler size={14} />
                    Medidas y ajuste
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <input name="draw_weight_lbs" type="number" step="0.1" placeholder="Libras reales" className={inputClass} />
                    <input name="draw_length_inches" type="number" step="0.1" placeholder="Apertura" className={inputClass} />
                    <input name="brace_height_cm" type="number" step="0.1" placeholder="Brace cm" className={inputClass} />

                    <input name="tiller_top_cm" type="number" step="0.1" placeholder="Tiller sup." className={inputClass} />
                    <input name="tiller_bottom_cm" type="number" step="0.1" placeholder="Tiller inf." className={inputClass} />
                    <input name="nocking_point_mm" type="number" step="0.1" placeholder="Nocking mm" className={inputClass} />
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <section className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <Crosshair size={14} />
                    Flechas
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <input name="arrow_brand" placeholder="Marca flecha" className={inputClass} />
                    <input name="arrow_model" placeholder="Modelo flecha" className={inputClass} />
                    <input name="spine" placeholder="Spine" className={inputClass} />

                    <input name="arrow_length_inches" type="number" step="0.1" placeholder="Largo flecha" className={inputClass} />
                    <input name="point_weight_grains" type="number" placeholder="Punta grains" className={inputClass} />
                  </div>
                </section>

                <section className={sectionClass}>
                  <div className={sectionTitleClass}>
                    <Settings size={14} />
                    Accesorios
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input name="sight_brand" placeholder="Marca mira" className={inputClass} />
                    <input name="sight_model" placeholder="Modelo mira" className={inputClass} />
                    <input name="rest_brand" placeholder="Marca repisa" className={inputClass} />
                    <input name="rest_model" placeholder="Modelo repisa" className={inputClass} />
                    <input name="plunger_brand" placeholder="Marca plunger" className={inputClass} />
                    <input name="plunger_model" placeholder="Modelo plunger" className={inputClass} />
                    <input name="stabilizer_brand" placeholder="Marca estabilizadores" className={inputClass} />
                    <input name="stabilizer_setup" placeholder="Setup estabilización" className={inputClass} />
                  </div>
                </section>
              </div>

              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Settings size={14} />
                  Cuerda y notas
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <input
                    name="string_material"
                    placeholder="Material cuerda"
                    className={inputClass}
                  />

                  <input
                    name="string_strands"
                    type="number"
                    placeholder="Hilos cuerda"
                    className={inputClass}
                  />

                  <textarea
                    name="notes"
                    placeholder="Notas del equipo"
                    rows={2}
                    className={`${inputClass} h-20 py-3 md:col-span-2`}
                  />
                </div>
              </section>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-white/10 bg-slate-950/95 py-4 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  <Save size={16} />
                  Guardar equipamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
