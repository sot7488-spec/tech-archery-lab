"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { createIndoorLeague } from "./actions";

const inputClass =
  "h-12 w-full rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

export default function IndoorLeagueCreateForm() {
  const [roundsCount, setRoundsCount] = useState(3);
  const rounds = useMemo(
    () => Array.from({ length: Math.max(1, roundsCount) }, (_, index) => index + 1),
    [roundsCount]
  );

  return (
    <form action={createIndoorLeague} className="tal-chart-card">
      <div className="mb-5 flex items-center gap-3">
        <span className="tal-metric-icon">
          <Plus size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Nueva liga indoor
          </p>
          <h2 className="text-2xl font-black">Crear temporada</h2>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Distancia</p>
          <p className="mt-1 text-2xl font-black">18 m</p>
        </div>
        <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Rama</p>
          <p className="mt-1 text-2xl font-black">Mixta</p>
        </div>
        <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Puntos</p>
          <p className="mt-1 text-2xl font-black">Tabla por jornada</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <input name="name" placeholder="Nombre de la liga" className={`${inputClass} md:col-span-2`} required />
        <select name="category" className={inputClass} required defaultValue="iniciacion">
          <option className="bg-slate-900 text-white" value="iniciacion">Iniciacion</option>
          <option className="bg-slate-900 text-white" value="infantil">Infantil</option>
          <option className="bg-slate-900 text-white" value="juvenil">Juvenil</option>
          <option className="bg-slate-900 text-white" value="abierta">Abierta</option>
        </select>
        <select name="bow_type" className={inputClass} required defaultValue="recurvo">
          <option className="bg-slate-900 text-white" value="recurvo">Recurvo</option>
          <option className="bg-slate-900 text-white" value="compuesto">Compuesto</option>
          <option className="bg-slate-900 text-white" value="barebow">Barebow</option>
        </select>
        <input name="target_size_cm" type="number" placeholder="Diana cm" defaultValue={40} className={inputClass} required />
        <input name="arrows_count" type="number" placeholder="Flechas por jornada" defaultValue={60} className={inputClass} required />
        <input
          name="rounds_count"
          type="number"
          min={1}
          max={12}
          value={roundsCount}
          onChange={(event) => setRoundsCount(Number(event.target.value || 1))}
          className={inputClass}
          required
        />
        <select name="status" className={inputClass} defaultValue="open">
          <option className="bg-slate-900 text-white" value="open">Abierta</option>
          <option className="bg-slate-900 text-white" value="draft">Borrador</option>
        </select>
        <input name="description" placeholder="Descripcion / reglas breves" className={`${inputClass} md:col-span-4`} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={18} className="text-cyan-300" />
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Fechas de jornada
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {rounds.map((roundNumber) => (
            <label key={roundNumber} className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Jornada {roundNumber}
              </span>
              <input
                name={`round_date_${roundNumber}`}
                type="date"
                className={inputClass}
                required
              />
            </label>
          ))}
        </div>
      </div>

      <button className="mt-5 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300">
        Crear liga con jornadas
      </button>
    </form>
  );
}
