"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { deleteClubWithStrategy } from "./actions";

type ClubOption = {
  id: string;
  name: string | null;
};

type Props = {
  athleteCount: number;
  club: ClubOption;
  clubs: ClubOption[];
};

export default function ClubDeleteModal({ athleteCount, club, clubs }: Props) {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState("migrate_athletes");
  const targetClubs = useMemo(
    () => clubs.filter((item) => item.id !== club.id),
    [clubs, club.id]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500 hover:text-white"
      >
        <Trash2 size={16} />
        Eliminar club
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl">
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-red-400/20 bg-slate-950 p-6 text-white shadow-[0_0_80px_rgba(239,68,68,0.16)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-xl bg-white/10 p-2 text-slate-300 hover:bg-white/20"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-red-400/20 bg-red-500/10 text-red-300">
                <AlertTriangle size={26} />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
                Accion irreversible
              </p>

              <h2 className="mt-2 text-3xl font-black">Eliminar {club.name}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                Este club tiene {athleteCount} atletas. Antes de eliminarlo elige
                si quieres migrarlos a otro club o eliminarlos junto con sus datos
                deportivos relacionados.
              </p>
            </div>

            <form action={deleteClubWithStrategy} className="space-y-5">
              <input type="hidden" name="club_id" value={club.id} />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="cursor-pointer rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <input
                    type="radio"
                    name="strategy"
                    value="migrate_athletes"
                    checked={strategy === "migrate_athletes"}
                    onChange={(event) => setStrategy(event.target.value)}
                    className="mr-2 accent-cyan-400"
                  />
                  <span className="font-black text-cyan-100">Migrar atletas</span>
                  <span className="mt-2 block text-sm font-bold text-slate-400">
                    Conserva atletas, usuarios, sesiones y resultados moviendolos
                    a otro club.
                  </span>
                </label>

                <label className="cursor-pointer rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                  <input
                    type="radio"
                    name="strategy"
                    value="delete_athletes"
                    checked={strategy === "delete_athletes"}
                    onChange={(event) => setStrategy(event.target.value)}
                    className="mr-2 accent-red-500"
                  />
                  <span className="font-black text-red-100">Eliminar atletas</span>
                  <span className="mt-2 block text-sm font-bold text-slate-400">
                    Borra perfiles de atletas, cuentas auth y datos deportivos del
                    club.
                  </span>
                </label>
              </div>

              {strategy === "migrate_athletes" && (
                <select
                  name="target_club_id"
                  required
                  className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 font-bold text-white outline-none"
                  defaultValue=""
                >
                  <option className="bg-slate-900 text-white" value="">
                    Selecciona club destino
                  </option>
                  {targetClubs.map((item) => (
                    <option className="bg-slate-900 text-white" key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                Los coaches y staff del club eliminado quedaran desactivados y sin
                club. Las invitaciones pendientes del club se eliminaran.
              </div>

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
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-400"
                >
                  <Trash2 size={16} />
                  Confirmar eliminacion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
