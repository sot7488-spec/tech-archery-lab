"use client";

import { useState } from "react";
import {
  Activity,
  CloudSun,
  Crosshair,
  Plus,
  Ruler,
  Save,
  Target,
  X,
} from "lucide-react";
import { createTraining } from "./actions";

type AthleteOption = {
  id: string;
  users?: { name?: string | null } | { name?: string | null }[] | null;
};

type EquipmentOption = {
  id: string;
  name: string | null;
  athlete_id: string;
};

type Props = {
  athletes: AthleteOption[];
  equipmentProfiles: EquipmentOption[];
  selectedAthleteId?: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-cyan-400/10 bg-white/[0.04] px-3 text-xs font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

const sectionClass =
  "rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-3 backdrop-blur-xl";

const sectionTitleClass =
  "mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300";

function getAthleteName(athlete: AthleteOption) {
  if (Array.isArray(athlete.users)) {
    return athlete.users[0]?.name || "Atleta sin nombre";
  }

  return athlete.users?.name || "Atleta sin nombre";
}

export default function TrainingCreateModal({
  athletes,
  equipmentProfiles,
  selectedAthleteId = "",
}: Props) {
  const [open, setOpen] = useState(false);

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
            TAL SESSION
          </p>
          <p className="mt-0.5 text-sm font-black text-white">Nueva sesión</p>
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
                  <Activity size={22} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                    TAL Training Registry
                  </p>

                  <h2 className="mt-0.5 text-2xl font-black text-white">
                    Registrar entrenamiento
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
              action={createTraining}
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
                  <select
                    name="athlete_id"
                    className={inputClass}
                    required
                    defaultValue={selectedAthleteId}
                  >
                    <option className="bg-slate-900 text-white" value="" disabled>
                      Selecciona atleta
                    </option>

                    {athletes.map((athlete) => (
                      <option
                        className="bg-slate-900 text-white"
                        key={athlete.id}
                        value={athlete.id}
                      >
                        {getAthleteName(athlete)}
                      </option>
                    ))}
                  </select>

                  <select name="equipment_profile_id" className={inputClass} defaultValue="">
                    <option className="bg-slate-900 text-white" value="">
                      Equipamiento utilizado
                    </option>

                    {equipmentProfiles.map((equipment) => (
                      <option
                        className="bg-slate-900 text-white"
                        key={equipment.id}
                        value={equipment.id}
                      >
                        {equipment.name || "Equipo sin nombre"}
                      </option>
                    ))}
                  </select>

                  <input
                    name="training_date"
                    type="date"
                    className={inputClass}
                    required
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Ruler size={14} />
                  Configuración de ronda
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
                    placeholder="Tamaño diana cm"
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
                </div>
              </section>

              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <CloudSun size={14} />
                  Contexto de entrenamiento
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input name="location" placeholder="Lugar" className={inputClass} />

                  <select name="session_type" className={inputClass} defaultValue="técnico">
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
                    className={inputClass}
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Crosshair size={14} />
                  Notas
                </div>

                <textarea
                  name="coach_notes"
                  placeholder="Notas del entrenador"
                  className={`${inputClass} h-24 py-3`}
                  rows={3}
                />
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
                  Crear entrenamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
