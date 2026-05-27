"use client";

import { useState } from "react";
import {
  ArrowRight,
  BowArrow,
  Crosshair,
  Gauge,
  Ruler,
  Target,
  Wrench,
  X,
  Settings,
} from "lucide-react";

type Props = {
  item: any;
};

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <p className="flex items-center gap-1 text-xs font-bold text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate font-black text-white">{value || "-"}</p>
    </div>
  );
}

export default function EquipmentCardModal({ item }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-4 text-left shadow-[0_0_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/[0.06]"
      >
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[96px_1.2fr_1.5fr_auto] md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] border border-cyan-400/15 bg-slate-900 text-cyan-300">
            <BowArrow size={42} />
          </div>

          <div>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
              {item.bow_type || "arco"}
            </span>

            <h2 className="mt-3 text-2xl font-black text-white">
              {item.name || "Equipo sin nombre"}
            </h2>

            <p className="mt-1 text-sm font-medium text-cyan-300">
              {item.athlete_profiles?.users?.name || "Sin atleta"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <InfoBox
              label="Riser"
              value={`${item.riser_brand || "-"} ${item.riser_model || ""}`}
              icon={<Wrench size={13} />}
            />
            <InfoBox
              label="Limbs"
              value={`${item.limb_brand || "-"} ${item.limbs_model || ""}`}
              icon={<BowArrow size={13} />}
            />
            <InfoBox
              label="Libras"
              value={item.draw_weight_lbs ? `${item.draw_weight_lbs} lbs` : "-"}
              icon={<Gauge size={13} />}
            />
          </div>

          <div className="flex justify-end">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 transition group-hover:translate-x-1">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950 text-white shadow-[0_0_90px_rgba(34,211,238,0.20)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Wrench size={24} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                    TAL Technical Sheet
                  </p>

                  <h2 className="text-2xl font-black">
                    {item.name || "Ficha técnica"}
                  </h2>

                  <p className="text-sm text-slate-400">
                    {item.athlete_profiles?.users?.name || "Sin atleta"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 hover:bg-white/20 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="
                flex-1 space-y-4 overflow-y-auto p-5
                [scrollbar-width:thin]
                [scrollbar-color:rgba(34,211,238,0.65)_rgba(15,23,42,0.9)]
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-slate-900
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-cyan-400/60
              "
            >
              <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoBox label="Tipo de arco" value={item.bow_type} icon={<BowArrow size={13} />} />
                <InfoBox label="Libras reales" value={item.draw_weight_lbs ? `${item.draw_weight_lbs} lbs` : "-"} icon={<Gauge size={13} />} />
                <InfoBox label="Apertura" value={item.draw_length_inches ? `${item.draw_length_inches}&quot;` : "-"} icon={<Ruler size={13} />} />
              </section>

              <section className="rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-4">
                <h3 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Arco / Riser / Limbs
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InfoBox label="Marca arco" value={item.bow_brand} />
                  <InfoBox label="Modelo arco" value={item.bow_model} />
                  <InfoBox label="Largo arco" value={item.bow_length_inches ? `${item.bow_length_inches}&quot;` : "-"} />
                  <InfoBox label="Marca riser" value={item.riser_brand} />
                  <InfoBox label="Modelo riser" value={item.riser_model} />
                  <InfoBox label="Riser pulgadas" value={item.riser_length_inches ? `${item.riser_length_inches}&quot;` : "-"} />
                  <InfoBox label="Marca limbs" value={item.limb_brand} />
                  <InfoBox label="Modelo limbs" value={item.limbs_model} />
                  <InfoBox label="Tamaño limbs" value={item.limb_length} />
                </div>
              </section>

              <section className="rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-4">
                <h3 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Medidas y ajuste
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InfoBox label="Brace height" value={item.brace_height_cm ? `${item.brace_height_cm} cm` : "-"} />
                  <InfoBox label="Tiller superior" value={item.tiller_top_cm ? `${item.tiller_top_cm} cm` : "-"} />
                  <InfoBox label="Tiller inferior" value={item.tiller_bottom_cm ? `${item.tiller_bottom_cm} cm` : "-"} />
                  <InfoBox label="Nocking point" value={item.nocking_point_mm ? `${item.nocking_point_mm} mm` : "-"} />
                </div>
              </section>

              <section className="rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-4">
                <h3 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Flechas
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InfoBox label="Marca flecha" value={item.arrow_brand} icon={<Crosshair size={13} />} />
                  <InfoBox label="Modelo flecha" value={item.arrow_model} />
                  <InfoBox label="Spine" value={item.spine} />
                  <InfoBox label="Largo flecha" value={item.arrow_length_inches ? `${item.arrow_length_inches}&quot;` : "-"} />
                  <InfoBox label="Peso punta" value={item.point_weight_grains ? `${item.point_weight_grains} gr` : "-"} />
                </div>
              </section>

              <section className="rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-4">
                <h3 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Accesorios
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <InfoBox label="Marca mira" value={item.sight_brand} icon={<Target size={13} />} />
                  <InfoBox label="Modelo mira" value={item.sight_model} />
                  <InfoBox label="Marca repisa" value={item.rest_brand} />
                  <InfoBox label="Modelo repisa" value={item.rest_model} />
                  <InfoBox label="Marca plunger" value={item.plunger_brand} />
                  <InfoBox label="Modelo plunger" value={item.plunger_model} />
                  <InfoBox label="Estabilizadores" value={item.stabilizer_brand} />
                  <InfoBox label="Setup" value={item.stabilizer_setup} />
                </div>
              </section>

              <section className="rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-4">
                <h3 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Cuerda y notas
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InfoBox label="Material cuerda" value={item.string_material} icon={<Settings size={13} />} />
                  <InfoBox label="Hilos cuerda" value={item.string_strands} />
                  <InfoBox label="Notas" value={item.notes} />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}