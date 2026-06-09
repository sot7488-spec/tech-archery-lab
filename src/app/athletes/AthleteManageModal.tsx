"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Trash2, UserCog, X } from "lucide-react";
import { manageAthleteWithStrategy } from "./actions";

type ClubOption = {
  id: string;
  name: string | null;
};

type AthleteOption = {
  id: string;
  name: string | null;
  club_id: string | null;
};

type Props = {
  athlete: AthleteOption;
  clubs: ClubOption[];
};

export default function AthleteManageModal({ athlete, clubs }: Props) {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState("migrate_athlete");
  const targetClubs = useMemo(
    () => clubs.filter((club) => club.id !== athlete.club_id),
    [clubs, athlete.club_id]
  );

  async function handleManageAthlete(formData: FormData) {
    await manageAthleteWithStrategy(formData);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-yellow-300/20 bg-yellow-300/10 px-5 py-3 text-sm font-black text-yellow-100 transition hover:border-yellow-200/40 hover:bg-yellow-300 hover:text-slate-950"
      >
        <UserCog size={18} />
        Gestionar atleta
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-5 backdrop-blur-xl">
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-yellow-300/20 bg-slate-950 p-6 text-white shadow-[0_0_90px_rgba(250,204,21,0.14)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-200">
                <AlertTriangle size={26} />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-200">
                Control de atleta
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Gestionar {athlete.name || "atleta"}
              </h2>

              <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                Puedes reubicar el atleta a otro club conservando su historial o
                eliminar su perfil deportivo y desactivar su cuenta.
              </p>
            </div>

            <form action={handleManageAthlete} className="space-y-5">
              <input type="hidden" name="athlete_id" value={athlete.id} />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="cursor-pointer rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <input
                    type="radio"
                    name="strategy"
                    value="migrate_athlete"
                    checked={strategy === "migrate_athlete"}
                    onChange={(event) => setStrategy(event.target.value)}
                    className="mr-2 accent-cyan-400"
                  />
                  <span className="inline-flex items-center gap-2 font-black text-cyan-100">
                    <ArrowRightLeft size={16} />
                    Reubicar
                  </span>
                  <span className="mt-2 block text-sm font-bold text-slate-400">
                    Mueve el perfil, usuario, entrenamientos, ligas y rutinas a
                    otro club. El coach asignado se limpia.
                  </span>
                </label>

                <label className="cursor-pointer rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                  <input
                    type="radio"
                    name="strategy"
                    value="delete_athlete"
                    checked={strategy === "delete_athlete"}
                    onChange={(event) => setStrategy(event.target.value)}
                    className="mr-2 accent-red-500"
                  />
                  <span className="inline-flex items-center gap-2 font-black text-red-100">
                    <Trash2 size={16} />
                    Eliminar
                  </span>
                  <span className="mt-2 block text-sm font-bold text-slate-400">
                    Borra el perfil de atleta y sus registros relacionados. La
                    cuenta queda desactivada para conservar referencias
                    historicas.
                  </span>
                </label>
              </div>

              {strategy === "migrate_athlete" && (
                <select
                  name="target_club_id"
                  required
                  className="w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-4 font-bold text-white outline-none transition focus:border-cyan-300/40"
                  defaultValue=""
                >
                  <option className="bg-slate-900 text-white" value="">
                    Selecciona club destino
                  </option>
                  {targetClubs.map((club) => (
                    <option
                      className="bg-slate-900 text-white"
                      key={club.id}
                      value={club.id}
                    >
                      {club.name || "Club sin nombre"}
                    </option>
                  ))}
                </select>
              )}

              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                Admin puede gestionar cualquier atleta. Coach solo puede
                gestionar atletas de su club actual.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/20"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={
                    strategy === "delete_athlete"
                      ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400"
                      : "inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                  }
                >
                  {strategy === "delete_athlete" ? (
                    <Trash2 size={16} />
                  ) : (
                    <ArrowRightLeft size={16} />
                  )}
                  Confirmar accion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
